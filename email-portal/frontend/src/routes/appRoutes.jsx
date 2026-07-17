import { Routes, Route } from 'react-router-dom';
import OfficeAdminDashboard from '../pages/officeAdmin/officeAdminDashboard';
import PortalManagerDashboard from '../pages/portalManager/portalManagerDashboard';
import LandingPage from "../pages/landingPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/office-admin" element={<OfficeAdminDashboard />} />
      <Route path="/portal-manager" element={<PortalManagerDashboard />} />
    </Routes>
  );
}