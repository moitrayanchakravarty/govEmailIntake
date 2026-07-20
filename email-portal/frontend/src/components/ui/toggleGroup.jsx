import styles from './toggleGroup.module.css';

/**
 * Segmented, card-style radio group — used for the 3-way
 * Name/Designation/Office-based toggle, the modification-type toggle, and
 * the deletion-reason toggle. Backed by a single enum field in the
 * schema, so this is a radiogroup (mutually exclusive), not checkboxes —
 * matches how models/RequestForm.js models each of these as one enum
 * value, not an array (even though the SOP document renders the deletion
 * reasons as ☐ checkboxes, only one can apply to a given account at
 * once, so a single-select toggle is the correct data shape here).
 */
export default function ToggleGroup({ legend, options, registration, error, required }) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>
        {legend}
        {required && <span aria-hidden="true"> *</span>}
      </legend>
      <div className={styles.options} role="radiogroup" aria-label={legend}>
        {options.map((opt) => (
          <label key={opt.value} className={styles.option}>
            <input type="radio" value={opt.value} className={styles.input} {...registration} />
            <span className={styles.optionBody}>
              <span className={styles.optionLabel}>{opt.label}</span>
              {opt.hint && <span className={styles.optionHint}>{opt.hint}</span>}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
