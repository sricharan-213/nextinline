import { useState } from 'react';
import CountdownTimer from './CountdownTimer';
import styles from './ApplicantCard.module.css';

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

export default function ApplicantCard({ applicant, onExit, showExit }) {
  const [reason, setReason] = useState('rejected');

  return (
    <div className={styles.card} data-testid="applicant-card">
      <div className={styles.top}>
        <div>
          <p className={styles.name}>{applicant.name}</p>
          <p className={styles.email}>{applicant.email}</p>
          <p className={styles.meta}>Updated {timeAgo(applicant.updated_at)}</p>
          {applicant.acknowledge_deadline && (
            <div className={styles.deadlineCompact}>
              <CountdownTimer deadline={applicant.acknowledge_deadline} />
            </div>
          )}
        </div>
        {applicant.status === 'waitlisted' && (
          <span className={styles.posBadge}>#{applicant.waitlist_position}</span>
        )}
        {applicant.status === 'pending_acknowledgment' && (
          <span className={styles.pendingBadge}>⏳ Pending</span>
        )}
      </div>

      {showExit && (
        <div className={styles.exitRow}>
          <select
            className={styles.exitSelect}
            value={reason}
            onChange={e => setReason(e.target.value)}
          >
            <option value="rejected">Rejected</option>
            <option value="hired">Hired ✓</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
          <button
            id={`btn-exit-${applicant.id}`}
            className={styles.exitBtn}
            onClick={() => onExit(applicant.id, reason)}
          >
            Exit
          </button>
        </div>
      )}
    </div>
  );
}
