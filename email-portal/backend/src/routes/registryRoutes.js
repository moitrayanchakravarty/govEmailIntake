const express = require('express');
const router = express.Router();
const { searchRegistry } = require('../controllers/registryController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// requireAuth runs first (confirms logged in), then requireRole (confirms
// they're one of the two roles that exist in this app). Data-level scoping
// (an office_admin only seeing their own office) happens INSIDE the
// controller, not here — this only gates who can hit the endpoint at all.
router.get('/search', requireAuth, requireRole('office_admin', 'portal_manager'), searchRegistry);

module.exports = router;

