import LogoutButton from '../../components/logoutButton';

export default function OfficeAdminDashboard() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Office Admin Dashboard</h1>
        <LogoutButton />
      </div>
      <p>Registry search UI goes here.</p>
    </div>
  );
}