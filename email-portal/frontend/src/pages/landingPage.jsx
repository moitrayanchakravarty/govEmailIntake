import SkipLink from '../components/common/skipLink';
import AppHeader from '../components/common/appHeader';
import AppFooter from '../components/common/appFooter';
import styles from './landingPage.module.css';

/**
 * Office admins and portal managers log in through the exact same form
 * (loginPage.jsx) — the backend session tells us which role logged in,
 * and only THEN do we send them to /office-admin or /portal-manager
 * (see loginPage.jsx's redirect logic). "Log In" is a single link and
 * it lives in AppHeader's navbar, not duplicated here.
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
        </section>
      </main>

      <AppFooter />
    </div>
  );
}