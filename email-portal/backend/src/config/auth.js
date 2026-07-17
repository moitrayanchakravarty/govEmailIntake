const { betterAuth } = require('better-auth');
const { mongodbAdapter } = require('better-auth/adapters/mongodb');
const { username } = require('better-auth/plugins');
const { APIError } = require('better-auth/api');
const { MongoClient } = require('mongodb');
const env = require('./env');

const client = new MongoClient(env.MONGO_URI);
const db = client.db();

const auth = betterAuth({
    database: mongodbAdapter(db),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
        enabled: true
    },
    plugins: [username()],
    // Blocks anyone from signing up through the public HTTP API.
    // The seed script below bypasses this deliberately via an env flag.
    databaseHooks: {
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
    }
});

module.exports = auth;

module.exports = auth;