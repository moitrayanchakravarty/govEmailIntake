const { parse } = require('csv-parse/sync');
const RequestForm = require('../models/requestForm');
const MasterRegistry = require('../models/MasterRegistry');
const { getNextSequence } = require('../models/counter');

const GOV_EMAIL_REGEX = MasterRegistry.GOV_EMAIL_REGEX;
const PHONE_REGEX = /^(\+91[-\s]?)?[6-9]\d{9}$/; // Indian mobile, optional +91 prefix
const PERSONAL_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FORM_CODE_BY_TYPE = {
    SINGLE_CREATION: 'EM-01',
    BULK_CREATION: 'EM-02',
    MODIFICATION: 'EM-04',
    DELETION: 'EM-05'
};

const ACTIVE_WORKFLOW_STATUSES = ['Pending', 'Reverted'];

class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

// ---------------------------------------------------------------------------
// Email validation (used both by the standalone real-time check endpoint and
// internally before any request is actually persisted/submitted)
// ---------------------------------------------------------------------------

/**
 * Checks whether `email` is a syntactically valid, currently-unclaimed
 * @assam.gov.in address.
 * @returns {Promise<{available: boolean, reason: string}>}
 */
const checkEmailAvailability = async (rawEmail) => {
    const email = (rawEmail || '').toLowerCase().trim();

    if (!email) {
        return { available: false, reason: 'Email address is required.' };
    }
    if (!GOV_EMAIL_REGEX.test(email)) {
        return { available: false, reason: 'Must be a valid address ending in @assam.gov.in' };
    }

    const existsInRegistry = await MasterRegistry.findOne({ emailAddress: email }).lean();
    if (existsInRegistry) {
        return { available: false, reason: 'This email address is already in use.' };
    }

    const existsInPendingRequests = await RequestForm.findOne({
        status: { $in: ACTIVE_WORKFLOW_STATUSES },
        $or: [
            { 'applicant.preferredEmailId': email },
            { 'bulkApplicants.preferredEmailId': email }
        ]
    }).lean();
    if (existsInPendingRequests) {
        return { available: false, reason: 'This email address is already requested in a pending application.' };
    }

    return { available: true, reason: 'Email address is available.' };
};

// ---------------------------------------------------------------------------
// Applicant row validation (shared by the single-account form and every row
// of a bulk upload)
// ---------------------------------------------------------------------------

const isValidDate = (v) => v && !isNaN(new Date(v).getTime());

/**
 * Validates one applicant row's shape/business rules. Does NOT hit the
 * database for the email-availability check unless `checkAvailability` is
 * true (bulk validation needs this per row; call sparingly, it's async).
 */
const validateApplicantFields = async (row, { checkAvailability = true } = {}) => {
    const errors = [];

    if (!row.fullName || !row.fullName.trim()) errors.push('Full name is required.');
    if (!row.designation || !row.designation.trim()) errors.push('Designation is required.');
    if (!row.departmentOffice || !row.departmentOffice.trim()) errors.push('Department/Office is required.');

    if (!isValidDate(row.dob)) {
        errors.push('Date of birth is invalid or missing.');
    }
    if (!isValidDate(row.retirementOrExpiryDate)) {
        errors.push('Date of retirement/expiry is invalid or missing.');
    }
    if (row.dob && row.retirementOrExpiryDate && isValidDate(row.dob) && isValidDate(row.retirementOrExpiryDate)) {
        if (new Date(row.retirementOrExpiryDate) <= new Date(row.dob)) {
            errors.push('Retirement/expiry date must be after date of birth.');
        }
    }

    if (row.personalEmail && !PERSONAL_EMAIL_REGEX.test(row.personalEmail)) {
        errors.push('Personal email ID is not a valid email address.');
    }

    if (!row.personalPhone || !PHONE_REGEX.test(String(row.personalPhone).replace(/\s/g, ''))) {
        errors.push('Personal phone number must be a valid 10-digit Indian mobile number.');
    }

    if (!row.purpose || !row.purpose.trim()) {
        errors.push('Purpose/Justification is required.');
    }

    const preferredEmailId = (row.preferredEmailId || '').toLowerCase().trim();
    if (!preferredEmailId) {
        errors.push('Preferred email ID is required.');
    } else if (!GOV_EMAIL_REGEX.test(preferredEmailId)) {
        errors.push('Preferred email ID must end with @assam.gov.in');
    } else if (checkAvailability) {
        const { available, reason } = await checkEmailAvailability(preferredEmailId);
        if (!available) errors.push(`Preferred email ID: ${reason}`);
    }

    return { isValid: errors.length === 0, errors };
};

const ACCOUNT_BASES = ['NAME_BASED', 'DESIGNATION_BASED', 'OFFICE_BASED'];

const validateAccountBasis = (basis, postOrOfficeName) => {
    const errors = [];
    if (!ACCOUNT_BASES.includes(basis)) {
        errors.push('Account basis must be one of Name-based, Designation-based, or Office-based.');
    } else if (basis !== 'NAME_BASED' && (!postOrOfficeName || !postOrOfficeName.trim())) {
        errors.push('Name of the post/office is required for Designation-based or Office-based accounts.');
    }
    return errors;
};

// ---------------------------------------------------------------------------
// CSV template + bulk upload parsing (Form EM-02)
// ---------------------------------------------------------------------------

const CSV_COLUMNS = [
    'fullName', 'designation', 'departmentOffice', 'dob', 'retirementOrExpiryDate',
    'personalEmail', 'personalPhone', 'purpose', 'preferredEmailId', 'postOrOfficeName'
];

const CSV_HEADER_LABELS = {
    fullName: 'Full Name',
    designation: 'Designation',
    departmentOffice: 'Department/Office',
    dob: 'DOB (DD-MM-YYYY)',
    retirementOrExpiryDate: 'Date of Retirement/Expiry (DD-MM-YYYY)',
    personalEmail: 'Personal Email ID',
    personalPhone: 'Personal Phone Number',
    purpose: 'Purpose/Justification',
    preferredEmailId: 'Preferred Email ID',
    postOrOfficeName: 'Post/Office Name (only for Designation or Office based)'
};

const generateCsvTemplate = () => {
    const header = CSV_COLUMNS.map((c) => CSV_HEADER_LABELS[c]).join(',');
    const exampleRow = [
        'Jane Doe', 'Section Officer', 'Directorate of IT Electronics & Communication',
        '15-08-1985', '31-08-2045', 'jane.doe@gmail.com', '9876543210',
        'Requires official email for departmental correspondence', 'jane.doe@assam.gov.in', ''
    ].join(',');
    const note = '# Do not remove/reorder the header row. Max 50 rows per upload (SOP limit). Dates must be DD-MM-YYYY.';
    return [note, header, exampleRow].join('\n');
};

/** Converts a DD-MM-YYYY string to a JS Date; returns Invalid Date if malformed. */
const parseDdMmYyyy = (value) => {
    if (!value) return null;
    const trimmed = String(value).trim();
    const match = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (match) {
        const [, dd, mm, yyyy] = match;
        return new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
    }
    // Fall back to whatever Date can natively parse (ISO, etc.)
    return new Date(trimmed);
};

/**
 * Parses an uploaded CSV buffer into normalized applicant row objects and
 * validates every row (including live email-availability + in-file
 * duplicate checks). Nothing is persisted here — this powers the
 * "review before you submit" table on the frontend.
 */
const parseAndValidateBulkCsv = async (buffer) => {
    let records;
    try {
        records = parse(buffer, {
            columns: CSV_COLUMNS,
            skip_empty_lines: true,
            trim: true,
            from_line: 2 // skip the instructional note row
        });
    } catch (err) {
        throw new ApiError(400, `Could not parse CSV file: ${err.message}`);
    }

    // First real data row is the header itself (from_line: 2 skipped the
    // note, but the header row is still there) — drop it if present.
    if (records.length && records[0].fullName === CSV_HEADER_LABELS.fullName) {
        records = records.slice(1);
    }

    if (records.length === 0) {
        throw new ApiError(400, 'No data rows found in the uploaded file.');
    }
    if (records.length > 50) {
        throw new ApiError(400, `Maximum 50 accounts allowed per bulk request (found ${records.length}).`);
    }

    const seenEmailsInFile = new Set();
    const rows = [];

    for (let i = 0; i < records.length; i++) {
        const raw = records[i];
        const row = {
            rowNumber: i + 1,
            fullName: raw.fullName || '',
            designation: raw.designation || '',
            departmentOffice: raw.departmentOffice || '',
            dob: parseDdMmYyyy(raw.dob),
            retirementOrExpiryDate: parseDdMmYyyy(raw.retirementOrExpiryDate),
            personalEmail: (raw.personalEmail || '').toLowerCase().trim(),
            personalPhone: raw.personalPhone || '',
            purpose: raw.purpose || '',
            preferredEmailId: (raw.preferredEmailId || '').toLowerCase().trim(),
            postOrOfficeName: raw.postOrOfficeName || ''
        };

        const { errors } = await validateApplicantFields(row, { checkAvailability: true });

        if (row.preferredEmailId) {
            if (seenEmailsInFile.has(row.preferredEmailId)) {
                errors.push('Duplicate preferred email ID within this file.');
            }
            seenEmailsInFile.add(row.preferredEmailId);
        }

        rows.push({ ...row, rowValidation: { isValid: errors.length === 0, errors } });
    }

    return rows;
};

// ---------------------------------------------------------------------------
// Request ID minting
// ---------------------------------------------------------------------------

const mintRequestId = async (formType) => {
    const formCode = FORM_CODE_BY_TYPE[formType];
    const year = new Date().getFullYear();
    const key = `${formCode}-${year}`;
    const seq = await getNextSequence(key);
    return `${key}-${String(seq).padStart(6, '0')}`;
};

// ---------------------------------------------------------------------------
// Applying an APPROVED request onto the live MasterRegistry
// ---------------------------------------------------------------------------

const upsertRegistryFromApplicant = async (applicant, { officeName, accountBasis, requestId }) => {
    await MasterRegistry.findOneAndUpdate(
        { emailAddress: applicant.preferredEmailId.toLowerCase().trim() },
        {
            $setOnInsert: {
                emailAddress: applicant.preferredEmailId.toLowerCase().trim(),
                creationDate: new Date()
            },
            $set: {
                status: 'Active',
                officeName,
                accountBasis,
                'deactivation.isDeactivated': false,
                currentCustodian: {
                    name: applicant.fullName,
                    designation: applicant.designation,
                    mobile: applicant.personalPhone,
                    dob: applicant.dob,
                    retirementDate: applicant.retirementOrExpiryDate
                }
            },
            $push: {
                custodianHistory: {
                    holderName: applicant.fullName,
                    designation: applicant.designation,
                    startDate: new Date(),
                    endDate: 'ongoing',
                    changeReason: `Provisioned via approved request ${requestId}`
                }
            }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

/**
 * Called exactly once, right after a portal manager APPROVEs a request.
 * Fans out to the correct MasterRegistry effect depending on formType.
 */
const applyApprovedRequestToRegistry = async (request) => {
    switch (request.formType) {
        case 'SINGLE_CREATION':
            await upsertRegistryFromApplicant(request.applicant, {
                officeName: request.officeName,
                accountBasis: request.accountBasis,
                requestId: request.requestId
            });
            break;

        case 'BULK_CREATION':
            for (const row of request.bulkApplicants) {
                await upsertRegistryFromApplicant(row, {
                    officeName: request.officeName,
                    accountBasis: request.accountBasis,
                    requestId: request.requestId
                });
            }
            break;

        case 'MODIFICATION': {
            const { existingEmailAddress, modificationType, newCustodianName, newCustodianDesignation, newValidityDate, reason } = request.modification;
            const email = existingEmailAddress.toLowerCase().trim();
            const record = await MasterRegistry.findOne({ emailAddress: email });
            if (!record) throw new ApiError(404, `Registry record for ${email} no longer exists.`);

            if (modificationType === 'CUSTODIAN_CHANGE') {
                // Close out the current custodian's history entry, then add the new one.
                record.custodianHistory.push({
                    holderName: record.currentCustodian.name,
                    designation: record.currentCustodian.designation,
                    startDate: record.custodianHistory.length
                        ? record.custodianHistory[record.custodianHistory.length - 1].startDate
                        : record.creationDate,
                    endDate: new Date(),
                    changeReason: reason
                });
                record.currentCustodian.name = newCustodianName;
                record.currentCustodian.designation = newCustodianDesignation;
                record.custodianHistory.push({
                    holderName: newCustodianName,
                    designation: newCustodianDesignation,
                    startDate: new Date(),
                    endDate: 'ongoing',
                    changeReason: `Custodian change via approved request ${request.requestId}`
                });
            } else if (modificationType === 'VALIDITY_EXTENSION') {
                record.validUntil = newValidityDate;
                record.currentCustodian.retirementDate = newValidityDate;
            }
            // OTHER modificationType is administrative-only (e.g. a note) and
            // does not itself mutate registry structure beyond the audit trail
            // already captured on the RequestForm document.

            await record.save();
            break;
        }

        case 'DELETION': {
            const email = request.deletion.existingEmailAddress.toLowerCase().trim();
            const record = await MasterRegistry.findOne({ emailAddress: email });
            if (!record) throw new ApiError(404, `Registry record for ${email} no longer exists.`);

            record.status = 'Inactive';
            record.deactivation = {
                isDeactivated: true,
                reason: request.deletion.reason,
                deactivatedAt: new Date(),
                requestId: request.requestId
            };
            await record.save();
            break;
        }

        default:
            throw new ApiError(400, `Unknown formType: ${request.formType}`);
    }
};

/**
 * Confirms the target account of a Modification/Deletion request actually
 * exists and (unless the caller is a portal_manager) belongs to the
 * caller's own office — an office admin should not be able to request
 * changes against another office's account.
 */
const assertRegistryOwnership = async (emailAddress, user) => {
    const record = await MasterRegistry.findOne({ emailAddress: emailAddress.toLowerCase().trim() }).lean();
    if (!record) {
        throw new ApiError(404, `No registry record found for ${emailAddress}.`);
    }
    if (user.role !== 'portal_manager' && record.officeName !== user.officeName) {
        throw new ApiError(403, 'This account does not belong to your office.');
    }
    return record;
};

module.exports = {
    ApiError,
    FORM_CODE_BY_TYPE,
    checkEmailAvailability,
    validateApplicantFields,
    validateAccountBasis,
    generateCsvTemplate,
    parseAndValidateBulkCsv,
    mintRequestId,
    applyApprovedRequestToRegistry,
    assertRegistryOwnership
};