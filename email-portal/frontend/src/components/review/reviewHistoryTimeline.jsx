import { formatDateTime } from '../../lib/utils';
import styles from './detailFields.module.css';

const ACTION_LABELS = {
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REVERTED: 'Reverted',
  RESUBMITTED: 'Resubmitted',
  DRAFT_SAVED: 'Draft Saved'
};

export default function ReviewHistoryTimeline({ history = [] }) {
  if (!history.length) return <p>No history yet.</p>;

  return (
    <ul className={styles.timeline}>
      {[...history].reverse().map((entry, i) => (
        <li key={i} className={styles.timelineItem}>
          <div className={styles.timelineHead}>
            <span className={styles.timelineAction}>{ACTION_LABELS[entry.action] || entry.action}</span>
            <span className={styles.timelineMeta}>
              {entry.actor?.name} ({entry.actor?.role}) · {formatDateTime(entry.timestamp)}
            </span>
          </div>
          {entry.comments && <p className={styles.timelineComments}>{entry.comments}</p>}
        </li>
      ))}
    </ul>
  );
}
