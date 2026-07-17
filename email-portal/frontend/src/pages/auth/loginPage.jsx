import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../../api/authClient';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { data, error: signInError } = await authClient.signIn.username({
      username,
      password
    });

    if (signInError) {
      setError(signInError.message || 'Invalid username or password.');
      return;
    }

      // Full page navigation instead of React Router's navigate().
      // This avoids a race with Better Auth's session hook re-fetching
      // (confirmed via HAR: a get-session request gets cancelled right
      // after sign-in, then a second one succeeds a moment later).
      // A hard navigation re-mounts everything and reads the fresh cookie
      // cleanly, instead of racing an in-memory session state update.
    if (data.user.role === 'portal_manager') {
      window.location.href = '/portal-manager';
    } else {
      window.location.href = '/office-admin';
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Log In</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Log In</button>
    </form>
  );
}