import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/landingPage';
import LoginPage from '../pages/auth/loginPage';
import OfficeAdminDashboard from '../pages/officeAdmin/officeAdminDashboard';
import PortalManagerDashboard from '../pages/portalManager/portalManagerDashboard';
import ProtectedRoute from './protectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute allow={['office_admin']} />}>
        <Route path="/office-admin" element={<OfficeAdminDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allow={['portal_manager']} />}>
        <Route path="/portal-manager" element={<PortalManagerDashboard />} />
      </Route>
    </Routes>
  );
}