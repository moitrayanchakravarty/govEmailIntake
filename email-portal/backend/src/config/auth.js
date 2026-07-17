/**
 * Central Better Auth configuration.
 *
 * Plugins used (deliberately, instead of hand-rolling any of this):
 *   - username : lets users log in with a username instead of an email.
 *   - admin    : gives us a native, validated `role` field, an access-control
 *                system, and admin-only management APIs (createUser, setRole,
 *                banUser, etc.) — this is what "role-based auth" is built on.
 *
 * Sign-up is intentionally blocked for everyone except our own seed script
 * (see scripts/createUser.js) via the databaseHooks.user.create.before hook.
 */

const { betterAuth } = require('better-auth');
const { mongodbAdapter } = require('better-auth/adapters/mongodb');
const { username, admin } = require('better-auth/plugins');
const { APIError, createAuthMiddleware } = require('better-auth/api');
const env = require('./env');

// Reuse the single shared MongoClient instead of creating a second
// connection just for Better Auth — both Mongoose (db.js) and Better Auth
// (here) can safely point at the same underlying database.
const client = require('./mongoClient');
const db = client.db();

const { ac, officeAdmin, portalManager } = require('./permissions');

const auth = betterAuth({
    database: mongodbAdapter(db),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,

    trustedOrigins: [env.CLIENT_URL],

    emailAndPassword: {
        enabled: true
        // Note: email/password sign-in still works under the hood — the
        // `username` plugin layers username-based login on top of it.
        // Real end users never see or use the email field directly.
    },

    // Brute-force protection on login.
    // IMPORTANT: Better Auth disables rate limiting entirely whenever
    // NODE_ENV isn't "production" — so `enabled: true` below is REQUIRED
    // to actually test/use this while NODE_ENV=development. Without it,
    // window/max are silently ignored no matter what they're set to.
    rateLimit: {
        enabled: true,
        window: 60,   // 60-second window
        max: 100,      // generous default for everything else under /api/auth
        customRules: {
            // Username-based sign-in gets a much stricter limit — this is
            // the actual brute-force protection point.
            '/sign-in/username': {
                window: 60,
                max: 5
            }
        }
    },

    // Tells Better Auth which headers to trust when resolving a request's
    // real IP address (used internally for rate limiting + session records,
    // and by our own hook below for failed-login logging). Centralizing this
    // here means every part of the app resolves IP the same, consistent way.
    advanced: {
        ipAddress: {
            ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'],
            disableIpTracking: false
        }
    },

    // Extra field(s) stored directly on the `user` collection.
    user: {
        additionalFields: {
            officeName: {
                type: 'string',
                required: false, // portal_manager users don't need one
                input: true      // allows it to be set via createUser()
            }
        }
    },

    plugins: [
        username(),
        admin({
            ac,
            roles: {
                office_admin: officeAdmin,
                portal_manager: portalManager
            },
            defaultRole: 'office_admin',
            // Only portal_manager accounts can call the admin plugin's
            // management endpoints (createUser, setRole, banUser, ...).
            adminRoles: ['portal_manager']
        })
    ],

    // Blocks account creation through the public HTTP API entirely.
    // scripts/createUser.js sets process.env.ALLOW_USER_SEED='true' before
    // it ever requires this file, so it's the ONLY caller that bypasses this.
    databaseHooks: {
        session: {
            create: {
                after: async (session) => {
                    await db.collection('loginAuditLog').insertOne({
                        event: 'LOGIN_SUCCESS',
                        userId: session.userId,
                        ipAddress: session.ipAddress || null,
                        userAgent: session.userAgent || null,
                        timestamp: new Date()
                    });
                }
            }
        },
        user: {
            create: {
                before: async () => {
                    if (!process.env.ALLOW_USER_SEED) {
                        throw new APIError('BAD_REQUEST', {
                            message: 'Sign-up is disabled. Contact an administrator.'
                        });
                    }
                }
            }
        }
    },

    // Global request hook — this is what actually catches FAILED logins.
    // (Better Auth treats "invalid username/password" as a normal, expected
    // response — not a thrown server error — so onAPIError never sees it.
    // ctx.context.returned in the "after" hook is where that response
    // actually lands, which is why we check it here instead.)
    hooks: {
        after: createAuthMiddleware(async (ctx) => {
            // Only care about sign-in attempts specifically.
            if (!ctx.path.includes('/sign-in')) return;

            const returned = ctx.context.returned;

            // A failed sign-in comes back as an APIError instance sitting in
            // ctx.context.returned. If it's present, the attempt failed.
            if (returned instanceof APIError) {
                // ctx.body holds whatever the client sent — we log the
                // attempted username, but NEVER the password itself.
                const attemptedUsername = ctx.body?.username || ctx.body?.email || 'unknown';

                await db.collection('loginAuditLog').insertOne({
                    event: 'LOGIN_FAILURE',
                    attemptedUsername,
                    reason: returned.body?.message || returned.message || 'Invalid credentials',
                    // FIX: read from ctx.headers, NOT ctx.request.headers.
                    // ctx.request is documented as "may not exist" on many
                    // endpoints/hooks — ctx.headers is the Headers object
                    // that's always reliably populated here. Reading from
                    // ctx.request.headers was silently resolving to null
                    // via optional chaining, which is why IP always showed
                    // up empty before.
                    ipAddress: ctx.headers?.get?.('x-forwarded-for')
                        || ctx.headers?.get?.('x-real-ip')
                        || null,
                    userAgent: ctx.headers?.get?.('user-agent') || null,
                    timestamp: new Date()
                });
            }
        })
    }
});

module.exports = auth;
