import { authClient } from '../api/authClient';

/**
 * Logs the current user out.
 *
 * authClient.signOut() (Better Auth's own client function) does two things
 * server-side: deletes the session document from MongoDB (real revocation,
 * not just a client-side flag) and clears the session cookie. Nothing
 * custom needed here — this is Better Auth's built-in mechanism end to end.
 */
export default function LogoutButton() {
  const handleLogout = async () => {
    await authClient.signOut();

    // Full page reload (not React Router's navigate) — same reasoning as
    // the login flow: forces every component to re-mount and re-check the
    // session fresh, avoiding any stale in-memory session state lingering
    // in useSession()'s cache after the cookie is already gone.
    window.location.href = '/login';
  };

  return <button onClick={handleLogout}>Log Out</button>;
}