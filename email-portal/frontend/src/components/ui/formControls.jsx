import styles from './formControls.module.css';

function Wrapper({ id, label, required, hint, error, statusAdornment, children }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && (
            <>
              <span aria-hidden="true"> *</span>
              <span className="sr-only"> (required)</span>
            </>
          )}
        </label>
        {statusAdornment}
      </div>

      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}

      {children({ hintId, errorId })}

      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({ id, label, required, hint, error, registration, type = 'text', statusAdornment, ...rest }) {
  return (
    <Wrapper id={id} label={label} required={required} hint={hint} error={error} statusAdornment={statusAdornment}>
      {({ hintId, errorId }) => (
        <input
          id={id}
          type={type}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          {...registration}
          {...rest}
        />
      )}
    </Wrapper>
  );
}

export function DateField(props) {
  return <TextField {...props} type="date" />;
}

export function TextAreaField({ id, label, required, hint, error, registration, rows = 4, ...rest }) {
  return (
    <Wrapper id={id} label={label} required={required} hint={hint} error={error}>
      {({ hintId, errorId }) => (
        <textarea
          id={id}
          rows={rows}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          className={`${styles.input} ${styles.textarea} ${error ? styles.inputError : ''}`}
          {...registration}
          {...rest}
        />
      )}
    </Wrapper>
  );
}

export function SelectField({ id, label, required, hint, error, registration, options, placeholder = 'Select…', ...rest }) {
  return (
    <Wrapper id={id} label={label} required={required} hint={hint} error={error}>
      {({ hintId, errorId }) => (
        <select
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          className={`${styles.input} ${styles.select} ${error ? styles.inputError : ''}`}
          {...registration}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </Wrapper>
  );
}
