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
 * Self sign-up for individual users. Two steps, both driven entirely by
 * Better Auth's own client methods — nothing here reimplements password
 * rules or OTP logic:
 *
 *   1. "details"  — collect name, office, email, password. Submitting
 *      calls authClient.signUp.email(...), then immediately requests a
 *      sign-up verification OTP (authClient.emailOtp.sendVerificationOtp
 *      with type: "email-verification").
 *   2. "verify"   — the 6-digit code screen. Submitting calls
 *      authClient.emailOtp.verifyEmail(...). Once verified, the account
 *      can sign in normally, so we route to /login rather than trying to
 *      establish a session here.
 *
 * Password length only (min 8 / max 128) is enforced — that's Better
 * Auth's own configured, recommended bound (config/auth.js), not a
 * custom policy invented here.
 */
export default function SignupPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState('details'); // 'details' | 'verify'

  const [name, setName] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [otp, setOtp] = useState('');
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

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        email: normalizedEmail,
        password,
        name: name.trim(),
        officeName: officeName.trim()
      });

      if (signUpError) {
        setError(signUpError.message || 'Could not create your account.');
        setIsSubmitting(false);
        return;
      }

      // requireEmailVerification is on server-side, so this account can't
      // sign in yet regardless — make sure no partial session lingers
      // client-side before moving to the OTP step.
      await authClient.signOut().catch(() => {});

      const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
        email: normalizedEmail,
        type: 'email-verification'
      });

      if (otpError) {
        setError(otpError.message || 'Account created, but the verification code could not be sent. Try resending it.');
      }

      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setStep('verify');
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
        type: 'email-verification'
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

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { error: verifyError } = await authClient.emailOtp.verifyEmail({
        email: normalizedEmail,
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
          {step === 'details' ? (
            <>
              <h1 className={styles.title}>Create an account</h1>

              {error && (
                <p ref={errorRef} tabIndex={-1} role="alert" className={styles.errorSummary}>
                  {error}
                </p>
              )}

              <form onSubmit={handleDetailsSubmit} noValidate>
                <FormField
                  id="name"
                  label="Full name"
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                  required
                />

                <FormField
                  id="officeName"
                  label="Office name"
                  value={officeName}
                  onChange={setOfficeName}
                  hint="Your requests are scoped to this office."
                  autoComplete="organization"
                  required
                />

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
                  label="Confirm password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                  required
                />

                <button type="submit" className={styles.submit} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <p className={styles.linkRow}>
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className={styles.title}>Verify your email</h1>
              <p className={styles.helper}>
                Enter the 6-digit code sent to {normalizedEmail}. It expires in 5 minutes.
              </p>

              {error && (
                <p ref={errorRef} tabIndex={-1} role="alert" className={styles.errorSummary}>
                  {error}
                </p>
              )}
              {info && <p className={styles.successSummary}>{info}</p>}

              <form onSubmit={handleVerifySubmit} noValidate>
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
            </>
          )}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
