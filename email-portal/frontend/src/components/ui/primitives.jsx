import styles from './primitives.module.css';

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...rest }) {
  return (
    <button
      className={`${styles.btn} ${styles[`btn-${variant}`]} ${styles[`btn-${size}`]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Badge({ variant = 'neutral', children }) {
  return <span className={`${styles.badge} ${styles[`badge-${variant}`]}`}>{children}</span>;
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <section className={`${styles.card} ${className}`}>
      {(title || actions) && (
        <header className={styles.cardHeader}>
          {title && <h2 className={styles.cardTitle}>{title}</h2>}
          {actions && <div className={styles.cardActions}>{actions}</div>}
        </header>
      )}
      <div className={styles.cardBody}>{children}</div>
    </section>
  );
}

export function Alert({ variant = 'info', title, children }) {
  return (
    <div className={`${styles.alert} ${styles[`alert-${variant}`]}`} role={variant === 'danger' ? 'alert' : 'status'}>
      {title && <p className={styles.alertTitle}>{title}</p>}
      <div className={styles.alertBody}>{children}</div>
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className={styles.spinnerWrap} role="status">
      <span className={styles.spinnerIcon} aria-hidden="true" />
      <span className={styles.spinnerLabel}>{label}</span>
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Dashboard sections">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          type="button"
          aria-selected={active === tab.value}
          className={`${styles.tab} ${active === tab.value ? styles.tabActive : ''}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {typeof tab.count === 'number' && tab.count > 0 && <span className={styles.tabCount}>{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyTitle}>{title}</p>
      {description && <p className={styles.emptyDesc}>{description}</p>}
      {action}
    </div>
  );
}
