import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authClient } from '../../api/authClient';
import SkipLink from '../../components/common/skipLink';
import AppHeader from '../../components/common/appHeader';
import AppFooter from '../../components/common/appFooter';
import FormField from '../../components/common/formField';
import styles from './loginPage.module.css';

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * OTP-based forgot-password flow, entirely via Better Auth's emailOTP
 * plugin client methods — no custom token/reset logic on either side:
 *
 *   1. "request" — email only. Calls
 *      authClient.emailOtp.sendVerificationOtp({ email, type: "forget-password" }).
 *   2. "reset"   — 6-digit code + new password. Calls
 *      authClient.emailOtp.resetPassword({ email, otp, password }), which
 *      verifies the code and updates the password in one call.
 *
 * Note: this app does NOT use Better Auth's link/token-based reset
 * (no sendResetPassword callback is configured server-side) — this OTP
 * flow is the only forgot-password path, for both regular users and
 * portal managers.
 */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState('request'); // 'request' | 'reset'

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorRef = useRef(null);

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

  const normalizedEmail = email.trim().toLowerCase();

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
        email: normalizedEmail,
        type: 'forget-password'
      });

      if (otpError) {
        setError(otpError.message || 'Could not send a reset code.');
        setIsSubmitting(false);
        return;
      }

      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setStep('reset');
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setInfo('');
    try {
      const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
        email: normalizedEmail,
        type: 'forget-password'
      });
      if (otpError) {
        setError(otpError.message || 'Could not resend the code.');
        return;
      }
      setInfo('A new code has been sent.');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: resetError } = await authClient.emailOtp.resetPassword({
        email: normalizedEmail,
        otp: otp.trim(),
        password
      });

      if (resetError) {
        setError(resetError.message || 'That code is incorrect or has expired.');
        setIsSubmitting(false);
        return;
      }

      navigate('/login?resetSuccess=1');
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
          {step === 'request' ? (
            <>
              <h1 className={styles.title}>Forgot password</h1>
              <p className={styles.helper}>
                Enter the email address on your account and we&apos;ll send you a reset code.
              </p>

              {error && (
                <p ref={errorRef} tabIndex={-1} role="alert" className={styles.errorSummary}>
                  {error}
                </p>
              )}

              <form onSubmit={handleRequestSubmit} noValidate>
                <FormField
                  id="email"
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                  required
                />

                <button type="submit" className={styles.submit} disabled={isSubmitting}>
                  {isSubmitting ? 'Sending code…' : 'Send reset code'}
                </button>
              </form>

              <p className={styles.linkRow}>
                Remembered it? <Link to="/login">Back to log in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className={styles.title}>Reset your password</h1>
              <p className={styles.helper}>
                Enter the 6-digit code sent to {normalizedEmail}, then choose a new password.
              </p>

              {error && (
                <p ref={errorRef} tabIndex={-1} role="alert" className={styles.errorSummary}>
                  {error}
                </p>
              )}
              {info && <p className={styles.successSummary}>{info}</p>}

              <form onSubmit={handleResetSubmit} noValidate>
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

                <FormField
                  id="password"
                  label="New password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={setPassword}
                  hint="At least 8 characters."
                  autoComplete="new-password"
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

                <FormField
                  id="confirmPassword"
                  label="Confirm new password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                  required
                />

                <button type="submit" className={styles.submit} disabled={isSubmitting}>
                  {isSubmitting ? 'Resetting…' : 'Reset password'}
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
            </>
          )}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
