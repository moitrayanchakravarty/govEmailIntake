process.env.ALLOW_USER_SEED = 'true'; // bypasses the hook above, only for this script
require('dotenv').config();
const auth = require('../src/config/auth');

const run = async () => {
    const [, , usernameArg, password, name] = process.argv;

    if (!usernameArg || !password) {
        console.log('Usage: node scripts/createUser.js <username> <password> [name]');
        process.exit(1);
    }

    const email = `${usernameArg}@internal.local`;

    const result = await auth.api.signUpEmail({
        body: {
            email,
            password,
            name: name || usernameArg,
            username: usernameArg
        }
    });

    console.log('User created:', result.user?.username || result);
    process.exit(0);
};

run().catch((err) => {
    console.error('Failed to create user:', err.message);
    process.exit(1);
});