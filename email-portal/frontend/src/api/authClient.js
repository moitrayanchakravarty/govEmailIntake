import { createAuthClient } from 'better-auth/react';
import { usernameClient, adminClient } from 'better-auth/client/plugins';

/**
 * usernameClient : lets us call authClient.signIn.username(...)
 * adminClient     : gives portal_manager-side code access to
 *                    authClient.admin.* (createUser, listUsers, etc.)
 *                    if you ever build an in-app admin panel later.
 *
 * createAuthClient (from better-auth/react) also gives us the
 * authClient.useSession() hook for free — no custom hook needed.
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL.replace('/api', ''),
  plugins: [usernameClient(), adminClient()]
});