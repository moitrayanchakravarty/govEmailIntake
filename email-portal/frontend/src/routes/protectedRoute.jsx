import { Navigate, Outlet } from 'react-router-dom';
import { authClient } from '../api/authClient';

/**
 * Gates a set of nested routes behind login + an allowed role list.
 * This is a UX convenience only — the REAL enforcement is the backend's
 * requireAuth/requireRole middleware (authMiddleware.js). Even if someone
 * bypassed this component entirely, the API would still reject them.
 */
export default function ProtectedRoute({ allow }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <p>Loading...</p>;
  if (!session) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(session.user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}