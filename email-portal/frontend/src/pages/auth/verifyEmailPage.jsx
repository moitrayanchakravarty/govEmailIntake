import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authClient } from '../../api/authClient';
import SkipLink from '../../components/common/skipLink';
import AppHeader from '../../components/common/appHeader';
import AppFooter from '../../components/common/appFooter';
import FormField from '../../components/common/formField';
import styles from './loginPage.module.css';

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Standalone "finish verifying your email" screen. Reached two ways:
 *   - directly after sign-up, if the person navigates away before
 *     finishing the OTP step on signupPage.jsx
 *   - redirected here by loginPage.jsx, when a sign-in attempt comes
 *     back with the "email not verified" (403) response
 *
 * Either way, an OTP is auto-requested on load (Better Auth's own
 * emailOTP plugin — see authClient.emailOtp.*) so the person doesn't
 * have to click anything extra before checking their inbox.
 */
export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromQuery = (searchParams.get('email') || '').trim().toLowerCase();

  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorRef = useRef(null);
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!emailFromQuery || autoSentRef.current) return;
    autoSentRef.current = true;
    authClient.emailOtp.sendVerificationOtp({ email: emailFromQuery, type: 'email-verification' })
      .then(({ error: otpError }) => {
        if (!otpError) setResendCooldown(RESEND_COOLDOWN_SECONDS);
      })
      .catch(() => {});
  }, [emailFromQuery]);

  const handleResend = async () => {
    if (resendCooldown > 0 || !email.trim()) return;
    setError('');
    setInfo('');
    try {
      const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: 'email-verification'
      });
      if (otpError) {
        setError(otpError.message || 'Could not send a verification code.');
        return;
      }
      setInfo('A verification code has been sent.');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { error: verifyError } = await authClient.emailOtp.verifyEmail({
        email: email.trim().toLowerCase(),
        otp: otp.trim()
      });

      if (verifyError) {
        setError(verifyError.message || 'That code is incorrect or has expired.');
        setIsSubmitting(false);
        return;
      }

      navigate('/login?verified=1');
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
          <h1 className={styles.title}>Verify your email</h1>
          <p className={styles.helper}>
            Your email address needs to be verified before you can log in. Enter the 6-digit code
            sent to your inbox.
          </p>

          {error && (
            <p ref={errorRef} tabIndex={-1} role="alert" className={styles.errorSummary}>
              {error}
            </p>
          )}
          {info && <p className={styles.successSummary}>{info}</p>}

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
              id="otp"
              label="Verification code"
              value={otp}
              onChange={setOtp}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              style={{ letterSpacing: '0.3em', textAlign: 'center' }}
              required
            />

            <button type="submit" className={styles.submit} disabled={isSubmitting || otp.trim().length !== 6}>
              {isSubmitting ? 'Verifying…' : 'Verify email'}
            </button>
          </form>

          <p className={styles.linkRow}>
            Didn&apos;t get a code?{' '}
            <button
              type="button"
              className={styles.textLink}
              onClick={handleResend}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
            </button>
          </p>
          <p className={styles.linkRow}>
            <Link to="/login">Back to log in</Link>
          </p>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
