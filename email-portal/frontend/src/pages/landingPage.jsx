import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div>
      <h1>Welcome</h1>

      <Link to="/office-admin">Office Admin</Link>
      <br />
      <Link to="/portal-manager">Portal Manager</Link>
    </div>
  );
}

export default LandingPage;