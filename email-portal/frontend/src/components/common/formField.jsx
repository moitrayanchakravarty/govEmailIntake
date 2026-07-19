import styles from './formField.module.css';

/**
 * One field = one real <label>, correctly linked to its <input> via
 * htmlFor/id, plus optional hint and error text linked via
 * aria-describedby. This wiring is what makes a screen reader announce
 * "Username, edit text, required" instead of just "edit text" — and it
 * only needs to be written correctly once, here, rather than re-derived
 * by hand on every form in the app.
 *
 * Deliberately NOT using placeholder text as a label substitute:
 * placeholders disappear the moment a user starts typing, which fails
 * WCAG 3.3.2 (Labels or Instructions) and is exactly the pattern the
 * reference site's mobile-number field falls into.
 *
 * `endAdornment` is a small escape hatch for things like a password
 * show/hide button — kept generic here rather than baking
 * password-specific logic into this shared component.
 */
export default function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  required = false,
  autoComplete,
  endAdornment,
  ...rest
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && (
          <>
            <span aria-hidden="true"> *</span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>

      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}

      <div className={styles.inputWrap}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          {...rest}
        />
        {endAdornment}
      </div>

      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}