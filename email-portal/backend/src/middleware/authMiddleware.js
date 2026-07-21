/**
 * Authentication + authorization middleware.
 *
 * requireAuth      : confirms a valid Better Auth session exists (via either
 *                     a Bearer token or the Better Auth session cookie) and
 *                     attaches the user (with .role and .officeName) to
 *                     req.user.
 * requireRole      : gate a route to one or more specific roles. Must run
 *                     AFTER requireAuth, since it reads req.user.
 * requireOwnership : gate a route so a regular user may only act on a
 *                     RequestForm document they themselves submitted.
 *                     portal_manager always passes. Must run AFTER a prior
 *                     middleware/controller step has attached
 *                     req.targetRequest (the loaded RequestForm document).
 */

const auth = require('../config/auth');
const { fromNodeHeaders } = require('better-auth/node');
const client = require('../config/mongoClient');

/**
 * Consolidates the two previously-duplicated "customRequireAuth" functions
 * that lived inline in routes/registryRoutes.js and routes/dashboardRoutes.js.
 *
 * Since Better Auth's Bearer plugin isn't enabled globally, both
 * authentication styles are supported manually here:
 *   1. `Authorization: Bearer <token>` — looked up directly against the
 *      `session` collection.
 *   2. Standard Better Auth session cookie — resolved via auth.api.getSession.
 */
exports.requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7).trim();
            const db = client.db();

            const sessionDoc = await db.collection('session').findOne({ token });
            if (sessionDoc && new Date(sessionDoc.expiresAt) > new Date()) {
                const userDoc = await db.collection('user').findOne({ _id: sessionDoc.userId });
                if (userDoc) {
                    req.user = userDoc;
                    return next();
                }
            }
        }

        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });

        if (session) {
            req.user = session.user;
            return next();
        }

        return res.status(401).json({
            success: false,
            message: 'Not authenticated. Please log in.'
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this resource.'
            });
        }
        next();
    };
};

/**
 * Data-security guard for the request workflow: a regular user may only
 * read/edit/submit/delete a RequestForm they personally created — even a
 * colleague in the same office cannot see or touch it. portal_manager is
 * exempt (global visibility is part of their role).
 *
 * Expects `req.targetRequest` to already be set (the controller loads the
 * document first, since a 404 vs 403 distinction matters for a sane error
 * message — see controllers/requestController.js).
 */
exports.requireOwnership = (req, res, next) => {
    if (req.user.role === 'portal_manager') return next();

    if (!req.targetRequest || req.targetRequest.submittedBy.userId !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to access this request.'
        });
    }
    next();
};