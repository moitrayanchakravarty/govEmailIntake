const express = require('express');
const router = express.Router();
// Import the search handler from registryController
const { searchRegistry } = require('../controllers/registryController');

// Reuse MongoClient to directly check active sessions from the DB
const client = require('../config/mongoClient');

/**
 * Custom Authentication Middleware
 * 
 * Why this exists:
 * Since Better Auth does not have the Bearer plugin enabled globally in our configuration,
 * we handle both cookie-based logins and token-based requests manually:
 * 
 * 1. Checks if the client provided a Bearer token in the 'Authorization' header.
 * 2. If present, it checks if a matching session exists in the database.
 * 3. If a valid, non-expired session is found, it loads the user profile, assigns it to `req.user`, and calls next().
 * 4. Otherwise, it falls back to standard cookie-based validation using Better Auth's getSession API.
 */
const customRequireAuth = async (req, res, next) => {
    try {
        // Step A: Extract the Authorization header
        const authHeader = req.headers.authorization;
        
        // Step B: If it starts with 'Bearer ', process the token lookup
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7).trim(); // Extract the token value
            const db = client.db();
            
            // Look up the session in the database
            const sessionDoc = await db.collection('session').findOne({ token });
            
            // Verify session document existence and ensure it hasn't expired yet
            if (sessionDoc && new Date(sessionDoc.expiresAt) > new Date()) {
                // Find the user associated with this session
                const userDoc = await db.collection('user').findOne({ _id: sessionDoc.userId });
                if (userDoc) {
                    req.user = userDoc; // Attach user details to the request object
                    return next();      // User authenticated successfully! Move to controller
                }
            }
        }
        
        // Step C: Fallback to checking Better Auth cookie sessions
        const auth = require('../config/auth');
        const { fromNodeHeaders } = require('better-auth/node');
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });
        if (session) {
            req.user = session.user; // Attach Better Auth session user details
            return next();           // Proceed to controller
        }

        // Step D: Deny access if no valid authentication method was provided
        return res.status(401).json({
            success: false,
            message: 'Not authenticated. Please log in.'
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Route: GET /api/registry/search
 * Description: Allows searching and filtering the Master Email Registry.
 * Security: Protected route. Scoped via customRequireAuth:
 *   - Office Admins are scoped to only see their own department's records.
 *   - Portal Managers have global visibility to search everything.
 */
router.get('/search', customRequireAuth, searchRegistry);

module.exports = router;
