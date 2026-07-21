const mongoose = require('mongoose');

/**
 * RequestForm
 * ------------
 * Single collection backing all four DITEC email-request forms:
 *
 *   formType            SOP form code   Notes
 *   -------------------  -------------  --------------------------------
 *   SINGLE_CREATION       EM-01          Name / Designation / Office based
 *                                        (EM-03 is folded in here via the
 *                                        `accountBasis` toggle, per policy
 *                                        decision to keep one creation
 *                                        form instead of two).
 *   BULK_CREATION         EM-02          Same fields as EM-01, many rows.
 *   MODIFICATION          EM-04          Custodian change / validity
 *                                        extension / other.
 *   DELETION              EM-05          Deletion / surrender.
 *
 * One schema (rather than 4 separate collections) so the review workflow,
 * dashboard aggregation (see services/dashboardService.js, which already
 * looks up a model literally named "RequestForm"), and audit history are
 * all uniform regardless of which form was used. Only the sub-object
 * matching `formType` is expected to be populated; the others stay
 * undefined. Fine-grained "is this field required for this specific
 * formType" business rules live in services/requestService.js, not here —
 * per this codebase's own layering convention (models = shape, services =
 * business rules).
 */

const APPLICANT_FIELDS = {
    fullName: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    departmentOffice: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },
    // Retirement date (regular employee) OR contract/consultancy end date.
    retirementOrExpiryDate: { type: Date, required: true },
    personalEmail: { type: String, trim: true, lowercase: true },
    personalPhone: { type: String, required: true, trim: true },
    purpose: { type: String, required: true, trim: true },
    // The @assam.gov.in address being requested. Real-time-checked on the
    // frontend via GET /api/registry/check-email, re-validated server-side
    // on submit in requestService.
    preferredEmailId: { type: String, required: true, trim: true, lowercase: true },
    // Only meaningful when accountBasis !== NAME_BASED — the post/office
    // this account is attached to (SOP Form EM-03, Part A).
    postOrOfficeName: { type: String, trim: true, default: null }
};

const ApplicantSchema = new mongoose.Schema(APPLICANT_FIELDS, { _id: false });

const BulkRowSchema = new mongoose.Schema({
    rowNumber: { type: Number, required: true },
    ...APPLICANT_FIELDS,
    // Per-row validation snapshot captured at upload/validate time so the
    // user's on-screen review table and the persisted record agree
    // on exactly what was flagged.
    rowValidation: {
        isValid: { type: Boolean, default: true },
        errors: { type: [String], default: [] }
    }
}, { _id: false });

const NodalOfficerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    departmentOffice: { type: String, required: true, trim: true },
    officialEmail: { type: String, required: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, trim: true },
    projectPurpose: { type: String, required: true, trim: true }
}, { _id: false });

const ModificationSchema = new mongoose.Schema({
    existingEmailAddress: { type: String, required: true, trim: true, lowercase: true },
    modificationType: {
        type: String,
        required: true,
        enum: ['CUSTODIAN_CHANGE', 'VALIDITY_EXTENSION', 'OTHER']
    },
    reason: { type: String, required: true, trim: true },
    // CUSTODIAN_CHANGE
    newCustodianName: { type: String, trim: true, default: null },
    newCustodianDesignation: { type: String, trim: true, default: null },
    // VALIDITY_EXTENSION
    newValidityDate: { type: Date, default: null },
    // OTHER
    otherDetails: { type: String, trim: true, default: null }
}, { _id: false });

const DELETION_REASONS = [
    'SUPERANNUATION_RETIREMENT',
    'CONTRACT_EXPIRY',
    'VOLUNTARY_SURRENDER',
    'DISCIPLINARY_ACTION',
    'POST_ABOLISHED',
    'DUPLICATE_ACCOUNT',
    'OTHER'
];

const DeletionSchema = new mongoose.Schema({
    existingEmailAddress: { type: String, required: true, trim: true, lowercase: true },
    accountHolderName: { type: String, required: true, trim: true },
    designation: { type: String, trim: true },
    departmentOffice: { type: String, trim: true },
    dob: { type: Date },
    retirementOrExpiryDate: { type: Date },
    mobile: { type: String, trim: true },
    reason: { type: String, required: true, enum: DELETION_REASONS },
    // DISCIPLINARY_ACTION
    orderReference: { type: String, trim: true, default: null },
    // DUPLICATE_ACCOUNT
    primaryAccountToRetain: { type: String, trim: true, lowercase: true, default: null },
    // OTHER
    otherSpecify: { type: String, trim: true, default: null }
}, { _id: false });

const ReviewHistoryEntrySchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['SUBMITTED', 'APPROVED', 'REJECTED', 'REVERTED', 'RESUBMITTED', 'DRAFT_SAVED']
    },
    comments: { type: String, trim: true, default: '' },
    actor: {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        role: { type: String, required: true }
    },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const RequestFormSchema = new mongoose.Schema({
    // Human-readable, sequential, per-form-type ID — e.g. "EM-01-2026-000042".
    // Generated once, on first real submission (not while still a Draft),
    // via models/Counter.js.
    requestId: { type: String, unique: true, sparse: true, index: true },

    formType: {
        type: String,
        required: true,
        enum: ['SINGLE_CREATION', 'BULK_CREATION', 'MODIFICATION', 'DELETION'],
        index: true
    },

    status: {
        type: String,
        required: true,
        enum: ['Draft', 'Pending', 'Approved', 'Rejected', 'Reverted'],
        default: 'Draft',
        index: true
    },

    // Data-scoping key — a user's queries are always filtered to
    // their own officeName (see middleware/authMiddleware.js +
    // controllers/requestController.js). Never trust a client-supplied
    // value for this; it is always taken from req.user.officeName at
    // creation time.
    officeName: { type: String, required: true, index: true },

    // Ownership — used for the stricter "a user can only see their own
    // submissions" rule (data security requirement: no user should see
    // another user's requests, even within the same office).
    submittedBy: {
        userId: { type: String, required: true, index: true },
        name: { type: String, required: true },
        email: { type: String, required: true }
    },

    // Applies to SINGLE_CREATION and BULK_CREATION only.
    accountBasis: {
        type: String,
        enum: ['NAME_BASED', 'DESIGNATION_BASED', 'OFFICE_BASED'],
        default: undefined
    },

    // --- formType-specific payloads (only the relevant one is populated) ---
    applicant: { type: ApplicantSchema, default: undefined },              // SINGLE_CREATION
    nodalOfficer: { type: NodalOfficerSchema, default: undefined },        // BULK_CREATION
    bulkApplicants: { type: [BulkRowSchema], default: undefined },         // BULK_CREATION
    modification: { type: ModificationSchema, default: undefined },       // MODIFICATION
    deletion: { type: DeletionSchema, default: undefined },               // DELETION

    // Full audit trail: every draft save, submission, resubmission, and
    // portal-manager decision, in order.
    reviewHistory: { type: [ReviewHistoryEntrySchema], default: [] },

    // Convenience denormalized fields (also derivable from reviewHistory,
    // but kept here so list views don't need to inspect the array).
    lastActionAt: { type: Date, default: Date.now },
    latestComments: { type: String, trim: true, default: '' },
    reviewedBy: {
        userId: { type: String, default: null },
        name: { type: String, default: null }
    },

    // If this request is a resubmission after a Revert, points back at
    // itself — kept for a fully traceable history (same document is
    // reused; this just marks that it has been resubmitted at least once).
    resubmissionCount: { type: Number, default: 0 },

    submittedAt: { type: Date, default: null },
    decidedAt: { type: Date, default: null }
}, {
    timestamps: true
});

RequestFormSchema.index({ officeName: 1, status: 1, formType: 1 });
RequestFormSchema.index({ 'submittedBy.userId': 1, status: 1 });

module.exports = mongoose.model('RequestForm', RequestFormSchema);
module.exports.DELETION_REASONS = DELETION_REASONS;