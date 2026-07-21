import { createAuthClient } from 'better-auth/react';
import { emailOTPClient, adminClient } from 'better-auth/client/plugins';

/**
 * emailOTPClient : gives us authClient.emailOtp.sendVerificationOtp(...),
 *                   authClient.emailOtp.verifyEmail(...), and
 *                   authClient.emailOtp.resetPassword(...) — matches the
 *                   emailOTP plugin enabled server-side (config/auth.js).
 *                   Powers both the sign-up email-verification step and
 *                   the forgot-password flow. No hand-rolled OTP logic on
 *                   this side either — same as the server.
 * adminClient     : gives portal_manager-side code access to
 *                    authClient.admin.* (createUser, listUsers, etc.)
 *                    if you ever build an in-app admin panel later.
 *
 * createAuthClient (from better-auth/react) also gives us the
 * authClient.useSession() hook for free — no custom hook needed.
 *
 * NOTE: there is no usernameClient here — this app signs in with
 * email + password only (authClient.signIn.email), matching the
 * emailAndPassword config on the server. There is no username plugin
 * enabled server-side.
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
  plugins: [emailOTPClient(), adminClient()]
});
