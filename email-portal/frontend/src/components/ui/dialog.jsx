import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './dialog.module.css';

/**
 * Minimal accessible modal: traps focus, restores focus to the trigger on
 * close, closes on Escape or backdrop click. No external dependency —
 * this app has no Radix/shadcn primitives installed, so this is the
 * hand-rolled equivalent, kept intentionally small.
 */
export default function Dialog({ open, onClose, title, children, footer, size = 'md' }) {
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    previouslyFocused.current = document.activeElement;
    dialogRef.current?.focus();

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${styles[`dialog-${size}`]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 id="dialog-title" className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
