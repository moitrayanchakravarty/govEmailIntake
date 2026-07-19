import { useEffect, useRef, useState } from 'react';
import { authClient } from '../../api/authClient';
import SkipLink from '../../components/common/skipLink';
import AppHeader from '../../components/common/appHeader';
import AppFooter from '../../components/common/appFooter';
import FormField from '../../components/common/formField';
import styles from './loginPage.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorRef = useRef(null);

  // Move focus to the error summary the moment one appears, so a screen
  // reader user hears the failure immediately instead of having to find
  // it. WCAG 3.3.1 (Error Identification) + GIGW error-handling guidance.
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data, error: signInError } = await authClient.signIn.username({
        username,
        password
      });

      if (signInError) {
        setError(signInError.message || 'Invalid username or password.');
        setIsSubmitting(false);
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
    } catch {
      // Network/server failure, as opposed to a rejected login — the
      // original version had no catch here, so this failed silently.
      setError('Could not reach the server. Check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <SkipLink />
      <AppHeader />

      <main id="main-content" className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Log in</h1>

          {error && (
            <p ref={errorRef} tabIndex={-1} role="alert" className={styles.errorSummary}>
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FormField
              id="username"
              label="Username"
              value={username}
              onChange={setUsername}
              autoComplete="username"
              required
            />

            <FormField
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              required
              style={{ paddingRight: '4.5rem' }}
              endAdornment={
                <button
                  type="button"
                  className={styles.passwordToggle}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                  <span className="sr-only"> password</span>
                </button>
              }
            />

            <button type="submit" className={styles.submit} disabled={isSubmitting}>
              {isSubmitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}