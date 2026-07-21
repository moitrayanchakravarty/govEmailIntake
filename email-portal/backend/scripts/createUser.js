/**
 * Admin-only portal_manager provisioning script.
 *
 * Every regular `user` account is created by the person themselves through
 * the public sign-up flow (email + password + OTP email verification —
 * see config/auth.js). The ONLY account type this script ever creates is
 * `portal_manager` — there is no public sign-up path for that role, and
 * this script is the sole way to create one.
 *
 * The password is generated here, on the server, rather than typed in —
 * this script prints it exactly once. Whoever runs this is responsible for
 * getting it to the portal manager through a secure channel; it is not
 * stored anywhere in plaintext after this.
 *
 * Usage:
 *   node scripts/createUser.js
 *   (then just answer the prompts)
 */

// Must be set BEFORE requiring auth.js — the databaseHooks check in
// config/auth.js reads this to skip the officeName requirement, since
// portal_manager accounts don't belong to any single office.
process.env.ALLOW_USER_SEED = 'true';

require('dotenv').config();
const crypto = require('crypto');
const readline = require('readline');
const auth = require('../src/config/auth');
const client = require('../src/config/mongoClient');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Wraps rl.question in a Promise so we can `await` each answer in sequence.
const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

/**
 * Generates a strong, random password server-side. 20 characters drawn
 * from a base64url alphabet comfortably clears Better Auth's configured
 * minPasswordLength (8) / maxPasswordLength (128) bounds (config/auth.js).
 */
const generatePassword = () => crypto.randomBytes(15).toString('base64url');

const run = async () => {
    console.log('--- Create New Portal Manager ---\n');
    console.log('(This script only creates portal_manager accounts. Regular');
    console.log('users sign themselves up at the normal login/sign-up page.)\n');

    const name = (await ask('Full name: ')).trim();
    const email = (await ask('Email: ')).trim().toLowerCase();

    rl.close();

    if (!name || !email) {
        console.log('\nName and email cannot be empty. Aborting.');
        process.exit(1);
    }

    const password = generatePassword();

    try {
        // auth.api.createUser is the admin plugin's own API — this is the
        // "admin-provisioned account" pathway it's designed for, as opposed
        // to the public signUpEmail endpoint (which portal_manager accounts
        // never go through).
        const result = await auth.api.createUser({
            body: {
                email,
                password,
                name,
                role: 'portal_manager'
            }
        });

        // Admin-provisioned accounts skip the OTP email-verification step
        // entirely (there's no sign-up OTP to verify, since this never went
        // through the public sign-up form) — mark the email verified
        // directly so requireEmailVerification doesn't lock this account out.
        const db = client.db();
        await db.collection('user').updateOne(
            { _id: result.user.id },
            { $set: { emailVerified: true } }
        );
        await client.close();

        console.log('\nPortal manager created successfully:');
        console.log('  name    :', result.user?.name);
        console.log('  email   :', email);
        console.log('  password:', password, '  <-- shown once, will not be shown again');
        process.exit(0);
    } catch (err) {
        console.error('\nFailed to create user:', err.message);
        process.exit(1);
    }
};

run();
