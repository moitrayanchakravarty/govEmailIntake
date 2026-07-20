import styles from './newRequestLauncher.module.css';

const CARDS = [
  { key: 'SINGLE_CREATION', code: 'EM-01', title: 'Single Email Account Creation', desc: 'Request one new official email address for a name, designation, or office.' },
  { key: 'BULK_CREATION', code: 'EM-02', title: 'Bulk Email Account Creation', desc: 'Request multiple accounts at once via a CSV upload — up to 50 per request.' },
  { key: 'MODIFICATION', code: 'EM-04', title: 'Account Modification', desc: 'Custodian change, validity extension, or other change to an existing account.' },
  { key: 'DELETION', code: 'EM-05', title: 'Deletion / Surrender', desc: 'Retire an account on retirement, contract expiry, or other SOP-listed grounds.' }
];

export default function NewRequestLauncher({ onSelect }) {
  return (
    <div className={styles.grid}>
      {CARDS.map((c) => (
        <button key={c.key} type="button" className={styles.card} onClick={() => onSelect(c.key)}>
          <span className={styles.code}>{c.code}</span>
          <div className={styles.title}>{c.title}</div>
          <p className={styles.desc}>{c.desc}</p>
        </button>
      ))}
    </div>
  );
}
