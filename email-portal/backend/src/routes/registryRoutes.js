const express = require('express');
const router = express.Router();

const { searchRegistry, checkEmailAvailability } = require('../controllers/registryController');
const { requireAuth } = require('../middleware/authMiddleware');

/**
 * Route: GET /api/registry/search
 * Description: Allows searching and filtering the Master Email Registry.
 * Security: Protected route. Scoped via requireAuth + in-controller scoping:
 *   - Regular users are scoped to only see their own department's records.
 *   - Portal Managers have global visibility to search everything.
 */
router.get('/search', requireAuth, searchRegistry);

/**
 * Route: GET /api/registry/check-email?email=...
 * Description: Real-time validation of a proposed Preferred Email ID —
 * checks @assam.gov.in format, live-registry collisions, and collisions
 * with any other in-flight (Pending/Reverted) request.
 * Security: Any authenticated user or portal_manager may call this
 * (no data is scoped/sensitive — it only confirms availability).
 */
router.get('/check-email', requireAuth, checkEmailAvailability);

module.exports = router;
