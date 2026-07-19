const express = require('express');
const router = express.Router();

const {
    downloadBulkTemplate,
    validateBulkUpload,
    createSingleRequest,
    createBulkRequest,
    createModificationRequest,
    createDeletionRequest,
    listRequests,
    getRequestById,
    updateDraft,
    deleteDraft,
    submitDraft,
    resubmitRequest,
    reviewRequest,
    loadRequestById
} = require('../controllers/requestController');

const { requireAuth, requireRole, requireOwnership } = require('../middleware/authMiddleware');
const { uploadCsv } = require('../middleware/upload');

router.use(requireAuth);

router.get('/bulk/template', requireRole('office_admin'), downloadBulkTemplate);
router.post('/bulk/validate', requireRole('office_admin'), uploadCsv.single('file'), validateBulkUpload);

router.post('/single', requireRole('office_admin'), createSingleRequest);
router.post('/bulk', requireRole('office_admin'), createBulkRequest);
router.post('/modification', requireRole('office_admin'), createModificationRequest);
router.post('/deletion', requireRole('office_admin'), createDeletionRequest);

router.get('/', listRequests);

router.get('/:id', loadRequestById, requireOwnership, getRequestById);
router.patch('/:id', loadRequestById, requireOwnership, requireRole('office_admin'), updateDraft);
router.delete('/:id', loadRequestById, requireOwnership, requireRole('office_admin'), deleteDraft);
router.post('/:id/submit', loadRequestById, requireOwnership, requireRole('office_admin'), submitDraft);
router.post('/:id/resubmit', loadRequestById, requireOwnership, requireRole('office_admin'), resubmitRequest);

router.post('/:id/review', loadRequestById, requireRole('portal_manager'), reviewRequest);

module.exports = router;