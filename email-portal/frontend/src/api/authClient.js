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
// Same fallback as api/axiosInstance.js — VITE_API_URL is expected to
// include the /api suffix (e.g. http://localhost:5000/api). Better Auth's
// own routes are mounted at /api/auth on the server (see app.js), but the
// Better Auth client wants its baseURL WITHOUT /api, so we strip it back
// off here. Guarding against a missing env var too: calling .replace() on
// undefined previously crashed the whole app at import time whenever
// VITE_API_URL wasn't set.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const authClient = createAuthClient({
  baseURL: API_BASE_URL.replace(/\/api\/?$/, ''),
  plugins: [usernameClient(), adminClient()]
});