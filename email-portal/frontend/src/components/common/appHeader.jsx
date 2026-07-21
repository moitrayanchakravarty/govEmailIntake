import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './appHeader.module.css';

const TEXT_SIZES = ['normal', 'large', 'xlarge'];
const TEXT_SIZE_LABELS = { normal: 'A', large: 'A+', xlarge: 'A++' };

/**
 * Navbar, then a thin utility strip directly beneath it carrying the
 * text-size control (A / A+ / A++). No logo — the department name is
 * plain text, since we don't have the approved department logo artwork
 * to use (and reproducing the State Emblem itself without it is legally
 * restricted under the State Emblem of India (Prohibition of Improper
 * Use) Act, 2005).
 *
 * Text-size control: clicking A / A+ / A++ sets `data-text-size` on
 * <html>, which tokens.css uses to scale the root font-size. Persisted to
 * localStorage; main.jsx applies the saved value before first paint so
 * returning users don't see a flash at the wrong size.
 */
export default function AppHeader() {
  const [textSize, setTextSize] = useState('normal');

  useEffect(() => {
    const stored = localStorage.getItem('textSize');
    if (stored && TEXT_SIZES.includes(stored)) {
      setTextSize(stored);
    }
  }, []);

  const applyTextSize = (size) => {
    setTextSize(size);
    document.documentElement.dataset.textSize = size;
    localStorage.setItem('textSize', size);
  };

  return (
    <>
      <header className={styles.mainHeader}>
        <nav className={styles.mainHeaderInner} aria-label="Primary">
          <Link to="/" className={styles.brand}>
            <span className={styles.brandText}>Govt. of Assam Email Management Portal</span>
          </Link>

          

          

          <div className={styles.divider} aria-hidden="true" />

          <a href="mailto:ditec-asm@gov.in" className={styles.supportBlock}>
            <span className={styles.supportLabel}>Support Email</span>
            <span className={styles.supportEmail}>ditec-asm@gov.in</span>
          </a>

          <Link to="/signup" className={styles.signInLink}>
            Sign Up
          </Link>

          <Link to="/login" className={styles.signInLink}>
            Log In
          </Link>
        </nav>
      </header>

      <div className={styles.textSizeStrip}>
        <div className={styles.textSizeInner}>
          <div className={styles.textSizeControls} role="group" aria-label="Adjust text size">
            {TEXT_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                className={styles.textSizeBtn}
                aria-pressed={textSize === size}
                onClick={() => applyTextSize(size)}
              >
                {TEXT_SIZE_LABELS[size]}
                <span className="sr-only"> text size {size}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}