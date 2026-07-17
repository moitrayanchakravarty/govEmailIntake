/**
 * Admin-only interactive user provisioning script.
 *
 * Run this from the terminal whenever you need to add a new user — there is
 * no public sign-up flow anywhere in this app, by design. This script asks
 * for each field one at a time instead of requiring you to remember
 * positional command-line arguments.
 *
 * Usage:
 *   node scripts/createUser.js
 *   (then just answer the prompts)
 */

// Must be set BEFORE requiring auth.js — the databaseHooks check in
// config/auth.js reads this to allow this one script to create users.
process.env.ALLOW_USER_SEED = 'true';

require('dotenv').config();
const readline = require('readline');
const auth = require('../src/config/auth');

const VALID_ROLES = ['office_admin', 'portal_manager'];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Wraps rl.question in a Promise so we can `await` each answer in sequence.
const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

const run = async () => {
    console.log('--- Create New User ---\n');

    const name = (await ask('Full name: ')).trim();
    const usernameArg = (await ask('Username: ')).trim();
    const password = (await ask('Password: ')).trim();

    // Keep asking until a valid role is entered instead of failing once
    // and forcing the person to restart the whole script.
    let role = '';
    while (!VALID_ROLES.includes(role)) {
        role = (await ask(`Role (${VALID_ROLES.join(' / ')}): `)).trim();
        if (!VALID_ROLES.includes(role)) {
            console.log(`Invalid role. Must be exactly one of: ${VALID_ROLES.join(', ')}`);
        }
    }

    // officeName is only relevant (and required) for office_admin —
    // portal_manager oversees every office, so it doesn't need one.
    let officeName;
    if (role === 'office_admin') {
        officeName = '';
        while (!officeName) {
            officeName = (await ask('Office name (required for office_admin): ')).trim();
        }
    }

    rl.close();

    if (!name || !usernameArg || !password) {
        console.log('\nName, username, and password cannot be empty. Aborting.');
        process.exit(1);
    }

    // Real login is by username, so the email is just internal plumbing —
    // nobody ever sees or types it.
    const email = `${usernameArg}@internal.local`;

    try {
        // auth.api.createUser is the admin plugin's own API — this is the
        // "admin-provisioned account" pathway it's designed for, as opposed
        // to the public signUpEmail endpoint (which stays blocked for
        // everyone else via the databaseHooks check in auth.js).
        const result = await auth.api.createUser({
            body: {
                email,
                password,
                name,
                role, // required, explicit — satisfies "state the kind of user at creation"
                data: {
                    username: usernameArg,
                    officeName: role === 'office_admin' ? officeName : undefined
                }
            }
        });

        console.log('\nUser created successfully:');
        console.log('  name    :', result.user?.name);
        console.log('  username:', usernameArg);
        console.log('  role    :', role);
        console.log('  office  :', officeName || 'N/A (portal_manager)');
        process.exit(0);
    } catch (err) {
        console.error('\nFailed to create user:', err.message);
        process.exit(1);
    }
};

run();