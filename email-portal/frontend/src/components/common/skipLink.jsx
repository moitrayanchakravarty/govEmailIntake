import styles from './skipLink.module.css';

/**
 * The first focusable element on the page. Invisible until it receives
 * keyboard focus (a sighted mouse user never sees it), at which point it
 * lets someone tabbing through — or a screen reader user — jump straight
 * past the masthead into the actual page content instead of tabbing
 * through header links on every single page load.
 *
 * GIGW mandates "Skip to Main Content" on every page; WCAG 2.4.1
 * (Bypass Blocks) requires an equivalent mechanism.
 */
export default function SkipLink({ targetId = 'main-content' }) {
  return (
    <a href={`#${targetId}`} className={styles.skipLink}>
      Skip to main content
    </a>
  );
}