import styles from './appFooter.module.css';

export default function AppFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p>&copy; {new Date().getFullYear()} Government of Assam. All rights reserved.</p>
      </div>
    </footer>
  );
}