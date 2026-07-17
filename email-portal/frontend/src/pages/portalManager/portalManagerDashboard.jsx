import LogoutButton from '../../components/logoutButton';

export default function PortalManagerDashboard() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Portal Manager Dashboard</h1>
        <LogoutButton />
      </div>
    </div>
  );
}