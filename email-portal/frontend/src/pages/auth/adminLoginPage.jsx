import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { authClient } from '../../api/authClient';
import SkipLink from '../../components/common/skipLink';
import AppHeader from '../../components/common/appHeader';
import AppFooter from '../../components/common/appFooter';
import FormField from '../../components/common/formField';
import styles from './loginPage.module.css';

/**
 * Separate sign-in page for portal_manager accounts only.
 *
 * Deliberately NOT the same form as the user login page: there is no
 * sign-up link here (portal_manager accounts are never self-registered —
 * they only come from backend/scripts/createUser.js, which generates and
 * prints the password once) and no "forgot password" self-service link,
 * since these accounts aren't provisioned by the person themselves.
 * Password recovery is a manual, out-of-band process (re-run the script
 * or have an existing portal manager reset it via the admin API), not a
 * public flow.
 */
export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorRef = useRef(null);

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
      const { data, error: signInError } = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password
      });

      if (signInError) {
        setError(signInError.message || 'Invalid email or password.');
        setIsSubmitting(false);
        return;
      }

      if (data.user.role !== 'portal_manager') {
        await authClient.signOut();
        setError('This sign-in is reserved for portal managers. Individual users should use the regular sign-in page.');
        setIsSubmitting(false);
        return;
      }

      // Full page navigation — see loginPage.jsx for why (avoids racing
      // Better Auth's session hook re-fetch right after sign-in).
      window.location.href = '/portal-manager';
    } catch {
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
          <h1 className={styles.title}>Portal manager sign-in</h1>

          {error && (
            <p ref={errorRef} tabIndex={-1} role="alert" className={styles.errorSummary}>
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FormField
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
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

          <p className={styles.altLoginRow}>
            Not a portal manager? <Link to="/login">User sign-in</Link>
          </p>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
