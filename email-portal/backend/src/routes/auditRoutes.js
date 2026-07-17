const express = require('express');
const router = express.Router();
const { getLoginLogs } = require('../controllers/auditController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Only portal_manager can view login history — an office_admin has no
// business seeing other users' login patterns.
router.get('/login-logs', requireAuth, requireRole('portal_manager'), getLoginLogs);

module.exports = router;