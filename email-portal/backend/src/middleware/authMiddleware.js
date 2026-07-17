/**
 * Authentication + authorization middleware.
 *
 * requireAuth : confirms a valid Better Auth session exists, attaches the
 *               user (with .role and .officeName) to req.user.
 * requireRole : gate a route to one or more specific roles. Must run AFTER
 *               requireAuth, since it reads req.user set by that middleware.
 */

const auth = require('../config/auth');
const { fromNodeHeaders } = require('better-auth/node');

exports.requireAuth = async (req, res, next) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers)
    });

    if (!session) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated. Please log in.'
        });
    }

    // session.user carries every additionalField too (role, officeName)
    // since Better Auth returns the full user document here.
    req.user = session.user;
    next();
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