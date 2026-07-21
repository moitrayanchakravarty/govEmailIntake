/**
 * Central Better Auth configuration.
 *
 * Auth model (two roles, two very different provisioning paths):
 *   - user           : the ordinary account type. Anyone can sign themselves
 *                      up with an email + password. There is no separate
 *                      "office admin" login/role anymore — a signed-up user
 *                      IS the office's applicant, end to end. Email is
 *                      verified via a one-time code (OTP) before the account
 *                      can sign in (see the `emailOTP` plugin below).
 *   - portal_manager : the only "admin-like" role left in the system. These
 *                      accounts are never created through the public
 *                      sign-up form — only via scripts/createUser.js, which
 *                      generates the password on the server and prints it
 *                      once. See databaseHooks.user.create.before.
 *
 * Plugins used (deliberately, instead of hand-rolling any of this):
 *   - emailOTP : Better Auth's own OTP engine — generation, hashing,
 *                expiry, and verification are all handled by Better Auth
 *                itself. This app only supplies the "how do we deliver the
 *                code" callback (services/emailService.js). Used for both
 *                (a) email verification at sign-up and (b) the forgot
 *                password flow — nothing here reimplements OTP logic.
 *   - admin    : gives us a native, validated `role` field, an access-control
 *                system, and admin-only management APIs (createUser, setRole,
 *                banUser, etc.) — this is what "role-based auth" is built on.
 */

const { betterAuth } = require('better-auth');
const { mongodbAdapter } = require('better-auth/adapters/mongodb');
const { emailOTP, admin } = require('better-auth/plugins');
const { APIError, createAuthMiddleware } = require('better-auth/api');
const env = require('./env');
const { sendOtpEmail } = require('../services/emailService');

// Reuse the single shared MongoClient instead of creating a second
// connection just for Better Auth — both Mongoose (db.js) and Better Auth
// (here) can safely point at the same underlying database.
const client = require('./mongoClient');
const db = client.db();

const { ac, user: userRole, portalManager } = require('./permissions');

const auth = betterAuth({
    database: mongodbAdapter(db),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,

    trustedOrigins: [env.CLIENT_URL],

    emailAndPassword: {
        enabled: true,
        // Block sign-in until the sign-up OTP has been verified (see the
        // emailOTP plugin below — verifying that OTP is what flips
        // user.emailVerified to true).
        requireEmailVerification: true,
        // These match Better Auth's own recommended/default bounds — we're
        // deliberately not inventing our own password policy, just stating
        // it explicitly so it's obvious this is a conscious choice.
        minPasswordLength: 8,
        maxPasswordLength: 128
        // NOTE: no `sendResetPassword` callback here on purpose. That
        // option powers Better Auth's link-based/token forgot-password
        // flow, which this app doesn't use — password resets go through
        // the OTP-based flow instead (emailOTP plugin, type: "forget-password").
    },

    // Brute-force protection on login + OTP requests.
    // IMPORTANT: Better Auth disables rate limiting entirely whenever
    // NODE_ENV isn't "production" — so `enabled: true` below is REQUIRED
    // to actually test/use this while NODE_ENV=development. Without it,
    // window/max are silently ignored no matter what they're set to.
    rateLimit: {
        enabled: true,
        window: 60,   // 60-second window
        max: 100,      // generous default for everything else under /api/auth
        customRules: {
            // Email+password sign-in gets a much stricter limit — this is
            // the actual brute-force protection point.
            '/sign-in/email': {
                window: 60,
                max: 5
            },
            // Covers all three OTP types (sign-up verification, forgot
            // password) since they all funnel through this one endpoint —
            // stops someone from hammering a mailbox with codes.
            '/email-otp/send-verification-otp': {
                window: 60,
                max: 3
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
                // Required for self-signed-up `user` accounts (enforced in
                // databaseHooks.user.create.before below, since a
                // per-role-conditional requirement can't be expressed here).
                // portal_manager accounts don't need one.
                required: false,
                input: true // allows it to be set directly on sign-up
            }
        }
    },

    plugins: [
        emailOTP({
            otpLength: 6,
            expiresIn: 300, // 5 minutes
            // Better Auth calls this with a ready-to-send OTP for one of
            // three flows: "sign-in", "email-verification", or
            // "forget-password". This app only makes use of the latter two
            // (login itself always stays email + password), but the
            // callback handles all three so the plugin API is fully honored.
            sendVerificationOTP: async ({ email, otp, type }) => {
                await sendOtpEmail({ email, otp, type });
            }
        }),
        admin({
            ac,
            roles: {
                user: userRole,
                portal_manager: portalManager
            },
            defaultRole: 'user',
            // Only portal_manager accounts can call the admin plugin's
            // management endpoints (createUser, setRole, banUser, ...).
            adminRoles: ['portal_manager']
        })
    ],

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
                // Self sign-up is allowed (that's the whole point now), but
                // every self-signed-up account needs an officeName so the
                // registry/dashboard/office-scoping logic elsewhere in the
                // app has something to scope by.
                //
                // scripts/createUser.js sets process.env.ALLOW_USER_SEED
                // before it ever requires this file — that's the ONLY path
                // that skips this check, since portal_manager accounts
                // (the only thing that script creates) have no office.
                before: async (userBeingCreated) => {
                    if (process.env.ALLOW_USER_SEED) return;

                    const officeName = userBeingCreated?.officeName;
                    if (!officeName || !String(officeName).trim()) {
                        throw new APIError('BAD_REQUEST', {
                            message: 'Office name is required to sign up.'
                        });
                    }
                }
            }
        }
    },

    // Global request hook — this is what actually catches FAILED logins.
    // (Better Auth treats "invalid email/password" as a normal, expected
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
                // attempted email, but NEVER the password itself.
                const attemptedEmail = ctx.body?.email || 'unknown';

                await db.collection('loginAuditLog').insertOne({
                    event: 'LOGIN_FAILURE',
                    attemptedEmail,
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
