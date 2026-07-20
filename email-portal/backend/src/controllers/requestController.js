const RequestForm = require('../models/requestForm');
const requestService = require('../services/requestService');
const { ApiError } = requestService;

const sendError = (res, error) => {
    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
};

const actorFromUser = (user) => ({
    userId: user.id,
    name: user.name,
    role: user.role
});

// ---------------------------------------------------------------------------
// Shared loader — used as route middleware ahead of requireOwnership, and
// directly by handlers below that need the document.
// ---------------------------------------------------------------------------

/**
 * @desc  Loads a RequestForm by :id onto req.targetRequest. 404s early with
 *        a clean message rather than letting every handler repeat the same
 *        lookup + not-found check.
 */
exports.loadRequestById = async (req, res, next) => {
    try {
        const request = await RequestForm.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found.' });
        }
        req.targetRequest = request;
        next();
    } catch (error) {
        return sendError(res, error);
    }
};

// ---------------------------------------------------------------------------
// Real-time / pre-submit validation helpers
// ---------------------------------------------------------------------------

/**
 * @desc    Download the standard CSV template for bulk account creation
 * @route   GET /api/requests/bulk/template
 * @access  Private (Office Admin)
 */
exports.downloadBulkTemplate = (req, res) => {
    const csv = requestService.generateCsvTemplate();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="bulk-email-request-template.csv"');
    res.status(200).send(csv);
};

/**
 * @desc    Parse + validate an uploaded bulk-creation CSV, returning a
 *          row-by-row result for the frontend's review table. Nothing is
 *          persisted at this stage.
 * @route   POST /api/requests/bulk/validate  (multipart/form-data, field "file")
 * @access  Private (Office Admin)
 */
exports.validateBulkUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No CSV file was uploaded.' });
        }
        const rows = await requestService.parseAndValidateBulkCsv(req.file.buffer);
        const invalidCount = rows.filter((r) => !r.rowValidation.isValid).length;

        res.status(200).json({
            success: true,
            totalRows: rows.length,
            validRows: rows.length - invalidCount,
            invalidRows: invalidCount,
            data: rows
        });
    } catch (error) {
        sendError(res, error);
    }
};

// ---------------------------------------------------------------------------
// Create (Single / Bulk / Modification / Deletion) — each supports
// saveAsDraft to satisfy the "draft saving facility" requirement.
// ---------------------------------------------------------------------------

/**
 * @desc    Create a Single Account Creation request (Form EM-01)
 * @route   POST /api/requests/single
 * @access  Private (Office Admin)
 */
exports.createSingleRequest = async (req, res) => {
    try {
        const { accountBasis, applicant, saveAsDraft } = req.body;

        const basisErrors = requestService.validateAccountBasis(accountBasis, applicant?.postOrOfficeName);
        let fieldErrors = [];
        if (!saveAsDraft) {
            const result = await requestService.validateApplicantFields(applicant || {}, { checkAvailability: true });
            fieldErrors = result.errors;
        }
        const allErrors = [...basisErrors, ...fieldErrors];
        if (allErrors.length) {
            return res.status(400).json({ success: false, message: 'Validation failed.', errors: allErrors });
        }

        const request = await createAndPersist(req, {
            formType: 'SINGLE_CREATION',
            accountBasis,
            applicant
        }, saveAsDraft);

        res.status(201).json({ success: true, data: request });
    } catch (error) {
        sendError(res, error);
    }
};

/**
 * @desc    Create a Bulk Account Creation request (Form EM-02) from
 *          already-validated rows (i.e. after the user reviewed the table
 *          returned by validateBulkUpload).
 * @route   POST /api/requests/bulk
 * @access  Private (Office Admin)
 */
exports.createBulkRequest = async (req, res) => {
    try {
        const { accountBasis, nodalOfficer, rows, saveAsDraft } = req.body;

        const basisErrors = requestService.validateAccountBasis(accountBasis, null);
        const errors = [...basisErrors];

        if (!Array.isArray(rows) || rows.length === 0) {
            errors.push('At least one applicant row is required.');
        } else if (rows.length > 50) {
            errors.push('Maximum 50 accounts allowed per bulk request.');
        }
        if (!saveAsDraft && Array.isArray(rows)) {
            const invalid = rows.filter((r) => r.rowValidation && r.rowValidation.isValid === false);
            if (invalid.length) {
                errors.push(`${invalid.length} row(s) still contain validation errors. Fix them before submitting.`);
            }
        }
        if (!nodalOfficer && !saveAsDraft) {
            errors.push('Nodal Officer details are required.');
        }
        if (errors.length) {
            return res.status(400).json({ success: false, message: 'Validation failed.', errors });
        }

        const bulkApplicants = (rows || []).map((r, idx) => ({ ...r, rowNumber: r.rowNumber || idx + 1 }));

        const request = await createAndPersist(req, {
            formType: 'BULK_CREATION',
            accountBasis,
            nodalOfficer,
            bulkApplicants
        }, saveAsDraft);

        res.status(201).json({ success: true, data: request });
    } catch (error) {
        sendError(res, error);
    }
};

/**
 * @desc    Create a Modification request (Form EM-04): custodian change,
 *          validity extension, or other.
 * @route   POST /api/requests/modification
 * @access  Private (Office Admin)
 */
exports.createModificationRequest = async (req, res) => {
    try {
        const { modification, saveAsDraft } = req.body;
        if (!modification || !modification.existingEmailAddress) {
            return res.status(400).json({ success: false, message: 'existingEmailAddress is required.' });
        }

        if (!saveAsDraft) {
            await requestService.assertRegistryOwnership(modification.existingEmailAddress, req.user);

            const errors = [];
            if (!modification.reason || !modification.reason.trim()) errors.push('Reason is required.');
            if (modification.modificationType === 'CUSTODIAN_CHANGE' && (!modification.newCustodianName || !modification.newCustodianDesignation)) {
                errors.push('New custodian name and designation are required for a custodian change.');
            }
            if (modification.modificationType === 'VALIDITY_EXTENSION' && !modification.newValidityDate) {
                errors.push('New validity/end date is required for a validity extension.');
            }
            if (modification.modificationType === 'OTHER' && (!modification.otherDetails || !modification.otherDetails.trim())) {
                errors.push('Please specify details for "Other" modification type.');
            }
            if (errors.length) {
                return res.status(400).json({ success: false, message: 'Validation failed.', errors });
            }
        }

        const request = await createAndPersist(req, {
            formType: 'MODIFICATION',
            modification
        }, saveAsDraft);

        res.status(201).json({ success: true, data: request });
    } catch (error) {
        sendError(res, error);
    }
};

/**
 * @desc    Create a Deletion/Surrender request (Form EM-05)
 * @route   POST /api/requests/deletion
 * @access  Private (Office Admin)
 */
exports.createDeletionRequest = async (req, res) => {
    try {
        const { deletion, saveAsDraft } = req.body;
        if (!deletion || !deletion.existingEmailAddress) {
            return res.status(400).json({ success: false, message: 'existingEmailAddress is required.' });
        }

        if (!saveAsDraft) {
            await requestService.assertRegistryOwnership(deletion.existingEmailAddress, req.user);

            const errors = [];
            if (!deletion.reason) errors.push('A reason for deletion must be selected.');
            if (deletion.reason === 'DISCIPLINARY_ACTION' && !deletion.orderReference) {
                errors.push('Order reference is required for Disciplinary/Administrative Action.');
            }
            if (deletion.reason === 'DUPLICATE_ACCOUNT' && !deletion.primaryAccountToRetain) {
                errors.push('Primary account to be retained must be specified for Duplicate Account.');
            }
            if (deletion.reason === 'OTHER' && (!deletion.otherSpecify || !deletion.otherSpecify.trim())) {
                errors.push('Please specify details for "Other" reason.');
            }
            if (errors.length) {
                return res.status(400).json({ success: false, message: 'Validation failed.', errors });
            }
        }

        const request = await createAndPersist(req, {
            formType: 'DELETION',
            deletion
        }, saveAsDraft);

        res.status(201).json({ success: true, data: request });
    } catch (error) {
        sendError(res, error);
    }
};

/** Shared create-and-save logic for all four "new request" endpoints above. */
async function createAndPersist(req, payload, saveAsDraft) {
    const now = new Date();
    const request = new RequestForm({
        ...payload,
        status: saveAsDraft ? 'Draft' : 'Pending',
        officeName: req.user.officeName,
        submittedBy: {
            userId: req.user.id,
            name: req.user.name,
            username: req.user.username || req.user.name
        },
        reviewHistory: [{
            action: saveAsDraft ? 'DRAFT_SAVED' : 'SUBMITTED',
            comments: '',
            actor: actorFromUser(req.user),
            timestamp: now
        }],
        lastActionAt: now,
        submittedAt: saveAsDraft ? null : now
    });

    if (!saveAsDraft) {
        request.requestId = await requestService.mintRequestId(request.formType);
    }

    await request.save();
    return request;
}

// ---------------------------------------------------------------------------
// Draft lifecycle: edit, delete, submit, resubmit
// ---------------------------------------------------------------------------

/**
 * @desc    Update a request that is still a Draft (owner only)
 * @route   PATCH /api/requests/:id
 * @access  Private (Office Admin — owner only)
 */
exports.updateDraft = async (req, res) => {
    try {
        const request = req.targetRequest;
        if (request.status !== 'Draft') {
            return res.status(400).json({ success: false, message: 'Only Draft requests can be edited directly. Use resubmit for a Reverted request.' });
        }

        const editableFields = ['accountBasis', 'applicant', 'nodalOfficer', 'bulkApplicants', 'modification', 'deletion'];
        editableFields.forEach((field) => {
            if (req.body[field] !== undefined) request[field] = req.body[field];
        });

        request.lastActionAt = new Date();
        request.reviewHistory.push({
            action: 'DRAFT_SAVED',
            comments: '',
            actor: actorFromUser(req.user),
            timestamp: new Date()
        });

        await request.save();
        res.status(200).json({ success: true, data: request });
    } catch (error) {
        sendError(res, error);
    }
};

/**
 * @desc    Delete a Draft request (owner only). Anything already submitted
 *          cannot be deleted, only withdrawn implicitly by never resubmitting.
 * @route   DELETE /api/requests/:id
 * @access  Private (Office Admin — owner only)
 */
exports.deleteDraft = async (req, res) => {
    try {
        const request = req.targetRequest;
        if (request.status !== 'Draft') {
            return res.status(400).json({ success: false, message: 'Only Draft requests can be deleted.' });
        }
        await request.deleteOne();
        res.status(200).json({ success: true, message: 'Draft deleted.' });
    } catch (error) {
        sendError(res, error);
    }
};

/**
 * @desc    Submit a saved Draft into the review queue (mints its requestId
 *          at this point, not at draft-creation time).
 * @route   POST /api/requests/:id/submit
 * @access  Private (Office Admin — owner only)
 */
exports.submitDraft = async (req, res) => {
    try {
        const request = req.targetRequest;
        if (request.status !== 'Draft') {
            return res.status(400).json({ success: false, message: 'Only Draft requests can be submitted.' });
        }

        const validationErrors = await validateRequestForSubmission(request);
        if (validationErrors.length) {
            return res.status(400).json({ success: false, message: 'Validation failed.', errors: validationErrors });
        }

        request.requestId = await requestService.mintRequestId(request.formType);
        request.status = 'Pending';
        request.submittedAt = new Date();
        request.lastActionAt = new Date();
        request.reviewHistory.push({
            action: 'SUBMITTED',
            comments: '',
            actor: actorFromUser(req.user),
            timestamp: new Date()
        });

        await request.save();
        res.status(200).json({ success: true, data: request });
    } catch (error) {
        sendError(res, error);
    }
};

/**
 * @desc    Resubmit a Reverted request after the office admin addresses the
 *          portal manager's comments. Accepts an optional updated payload.
 * @route   POST /api/requests/:id/resubmit
 * @access  Private (Office Admin — owner only)
 */
exports.resubmitRequest = async (req, res) => {
    try {
        const request = req.targetRequest;
        if (request.status !== 'Reverted') {
            return res.status(400).json({ success: false, message: 'Only Reverted requests can be resubmitted.' });
        }

        const editableFields = ['accountBasis', 'applicant', 'nodalOfficer', 'bulkApplicants', 'modification', 'deletion'];
        editableFields.forEach((field) => {
            if (req.body[field] !== undefined) request[field] = req.body[field];
        });

        const validationErrors = await validateRequestForSubmission(request);
        if (validationErrors.length) {
            return res.status(400).json({ success: false, message: 'Validation failed.', errors: validationErrors });
        }

        request.status = 'Pending';
        request.resubmissionCount += 1;
        request.submittedAt = new Date();
        request.lastActionAt = new Date();
        request.latestComments = '';
        request.reviewHistory.push({
            action: 'RESUBMITTED',
            comments: req.body.responseNote || '',
            actor: actorFromUser(req.user),
            timestamp: new Date()
        });

        await request.save();
        res.status(200).json({ success: true, data: request });
    } catch (error) {
        sendError(res, error);
    }
};

/** Re-runs full business validation on a request right before it enters the queue. */
async function validateRequestForSubmission(request) {
    const errors = [];
    switch (request.formType) {
        case 'SINGLE_CREATION': {
            errors.push(...requestService.validateAccountBasis(request.accountBasis, request.applicant?.postOrOfficeName));
            const { errors: fieldErrors } = await requestService.validateApplicantFields(request.applicant || {}, { checkAvailability: true });
            errors.push(...fieldErrors);
            break;
        }
        case 'BULK_CREATION': {
            errors.push(...requestService.validateAccountBasis(request.accountBasis, null));
            if (!request.nodalOfficer) errors.push('Nodal Officer details are required.');
            if (!request.bulkApplicants || !request.bulkApplicants.length) errors.push('At least one applicant row is required.');
            break;
        }
        case 'MODIFICATION': {
            if (!request.modification?.reason) errors.push('Reason is required.');
            break;
        }
        case 'DELETION': {
            if (!request.deletion?.reason) errors.push('A reason for deletion must be selected.');
            break;
        }
    }
    return errors;
}

// ---------------------------------------------------------------------------
// Listing / detail
// ---------------------------------------------------------------------------

/**
 * @desc    List requests. office_admin sees only their own submissions
 *          (strict per-user scoping — not just per-office — so no office
 *          admin can see another office admin's requests). portal_manager
 *          sees every office's requests.
 * @route   GET /api/requests?formType=&status=&page=&limit=
 * @access  Private
 */
exports.listRequests = async (req, res) => {
    try {
        const { formType, status, page = 1, limit = 20 } = req.query;
        const query = {};

        if (req.user.role === 'office_admin') {
            query['submittedBy.userId'] = req.user.id;
        }
        if (formType) query.formType = formType;
        if (status) query.status = status;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

        const [data, total] = await Promise.all([
            RequestForm.find(query)
                .sort({ updatedAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
            RequestForm.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
        });
    } catch (error) {
        sendError(res, error);
    }
};

/**
 * @desc    Get a single request's full detail.
 * @route   GET /api/requests/:id
 * @access  Private (owner office_admin, or any portal_manager)
 */
exports.getRequestById = async (req, res) => {
    res.status(200).json({ success: true, data: req.targetRequest });
};

// ---------------------------------------------------------------------------
// Portal Manager review action
// ---------------------------------------------------------------------------

/**
 * @desc    Accept, reject, or revert a Pending request. On APPROVE, the
 *          change is fanned out onto the live MasterRegistry.
 * @route   POST /api/requests/:id/review   { action: 'APPROVE'|'REJECT'|'REVERT', comments }
 * @access  Private (Portal Manager only)
 */
exports.reviewRequest = async (req, res) => {
    try {
        const request = req.targetRequest;
        const { action, comments } = req.body;

        if (!['APPROVE', 'REJECT', 'REVERT'].includes(action)) {
            return res.status(400).json({ success: false, message: 'action must be APPROVE, REJECT, or REVERT.' });
        }
        if (request.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'Only Pending requests can be reviewed.' });
        }
        if (action === 'REVERT' && (!comments || !comments.trim())) {
            return res.status(400).json({ success: false, message: 'Comments are required when reverting a request.' });
        }

        if (action === 'APPROVE') {
            await requestService.applyApprovedRequestToRegistry(request);
            request.status = 'Approved';
            request.decidedAt = new Date();
        } else if (action === 'REJECT') {
            request.status = 'Rejected';
            request.decidedAt = new Date();
        } else {
            request.status = 'Reverted';
        }

        request.latestComments = comments || '';
        request.reviewedBy = { userId: req.user.id, name: req.user.name };
        request.lastActionAt = new Date();
        request.reviewHistory.push({
            action: action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'REVERTED',
            comments: comments || '',
            actor: actorFromUser(req.user),
            timestamp: new Date()
        });

        await request.save();
        res.status(200).json({ success: true, data: request });
    } catch (error) {
        sendError(res, error);
    }
};