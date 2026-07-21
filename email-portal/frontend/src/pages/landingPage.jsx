import { Link } from 'react-router-dom';
import SkipLink from '../components/common/skipLink';
import AppHeader from '../components/common/appHeader';
import AppFooter from '../components/common/appFooter';
import styles from './landingPage.module.css';

/**
 * Individual users sign themselves up and log in through their own
 * email + password (see pages/auth/signupPage.jsx and loginPage.jsx).
 * Portal managers have a completely separate sign-in at /admin/login —
 * there is no office-admin role and no shared login form anymore.
 * "Log In" / "Sign Up" links live in AppHeader's navbar; the hero below
 * repeats "Sign Up" as the primary call to action for first-time visitors.
 */
export default function LandingPage() {
  return (
    <div className={styles.page}>
      <SkipLink />
      <AppHeader />

      <main id="main-content" className={styles.main}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <h1 id="hero-title" className={styles.heroTitle}>
            Apply for and manage @assam.gov.in Emails.
          </h1>
          <div className={styles.heroActions}>
            <Link to="/signup" className={styles.heroPrimaryAction}>Sign Up</Link>
            <Link to="/login" className={styles.heroSecondaryAction}>Log In</Link>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}