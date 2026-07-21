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

router.get('/bulk/template', requireRole('user'), downloadBulkTemplate);
router.post('/bulk/validate', requireRole('user'), uploadCsv.single('file'), validateBulkUpload);

router.post('/single', requireRole('user'), createSingleRequest);
router.post('/bulk', requireRole('user'), createBulkRequest);
router.post('/modification', requireRole('user'), createModificationRequest);
router.post('/deletion', requireRole('user'), createDeletionRequest);

router.get('/', listRequests);

router.get('/:id', loadRequestById, requireOwnership, getRequestById);
router.patch('/:id', loadRequestById, requireOwnership, requireRole('user'), updateDraft);
router.delete('/:id', loadRequestById, requireOwnership, requireRole('user'), deleteDraft);
router.post('/:id/submit', loadRequestById, requireOwnership, requireRole('user'), submitDraft);
router.post('/:id/resubmit', loadRequestById, requireOwnership, requireRole('user'), resubmitRequest);

router.post('/:id/review', loadRequestById, requireRole('portal_manager'), reviewRequest);

module.exports = router;