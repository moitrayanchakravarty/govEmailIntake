import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/landingPage';
import LoginPage from '../pages/auth/loginPage';
import SignupPage from '../pages/auth/signupPage';
import ForgotPasswordPage from '../pages/auth/forgotPasswordPage';
import VerifyEmailPage from '../pages/auth/verifyEmailPage';
import AdminLoginPage from '../pages/auth/adminLoginPage';
import UserDashboard from '../pages/user/userDashboard';
import PortalManagerDashboard from '../pages/portalManager/portalManagerDashboard';
import ProtectedRoute from './protectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* User-facing auth: self sign-up, email+password login, OTP-based
          email verification and forgot-password. */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Portal manager auth: a separate sign-in page, no sign-up —
          accounts are provisioned only via backend/scripts/createUser.js. */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route element={<ProtectedRoute allow={['user']} />}>
        <Route path="/dashboard" element={<UserDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allow={['portal_manager']} />}>
        <Route path="/portal-manager" element={<PortalManagerDashboard />} />
      </Route>
    </Routes>
  );
}
