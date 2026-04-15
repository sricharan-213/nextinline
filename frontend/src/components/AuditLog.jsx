import styles from './AuditLog.module.css';

const EVENT_META = {
  applied:      { cls: styles.evApplied,      icon: '📥' },
  promoted:     { cls: styles.evPromoted,     icon: '⬆' },
  acknowledged: { cls: styles.evAcknowledged, icon: '✅' },
  decayed:      { cls: styles.evDecayed,      icon: '📉' },
  withdrawn:    { cls: styles.evWithdrawn,    icon: '↩' },
  rejected:     { cls: styles.evRejected,     icon: '❌' },
  hired:        { cls: styles.evHired,        icon: '🎉' },
  requeued:     { cls: styles.evRequeued,     icon: '🔄' },
};

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function AuditLog({ events }) {
  return (
    <div className={styles.auditWrap}>
      <div className={styles.auditHeader}>
        <span className={styles.auditTitle}>
          📜 Audit Log
        </span>
        <span className={styles.auditCount}>{events.length} events</span>
      </div>

      {events.length === 0 ? (
        <div className={styles.auditEmpty}>
          <span>📋</span>
          No events recorded yet. Apply to this job to see the pipeline in action.
        </div>
      ) : (
        <div className={styles.auditTableWrap}>
          <table className={styles.auditTable}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Applicant</th>
                <th>Event</th>
                <th>Transition</th>
                <th>Position</th>
              </tr>
            </thead>
            <tbody>
              {events.map(e => {
                const meta = EVENT_META[e.event] || { cls: styles.evDefault, icon: '•' };
                return (
                  <tr key={e.id}>
                    <td className={styles.auditTime}>
                      <div>{formatTime(e.created_at)}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{formatDate(e.created_at)}</div>
                    </td>
                    <td>
                      <div className={styles.auditApplicant}>{e.applicant_name || '—'}</div>
                      {e.applicant_email && <div className={styles.auditEmail}>{e.applicant_email}</div>}
                    </td>
                    <td>
                      <span className={`${styles.eventChip} ${meta.cls}`}>
                        {meta.icon} {e.event}
                      </span>
                    </td>
                    <td>
                      {e.old_status && e.new_status ? (
                        <span>
                          <span className={styles.transitionFrom}>{e.old_status}</span>
                          <span className={styles.transitionArrow}>→</span>
                          <span className={styles.transitionTo}>{e.new_status}</span>
                        </span>
                      ) : e.new_status ? (
                        <span className={styles.transitionTo}>{e.new_status}</span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      {e.new_position != null
                        ? <span className={styles.posChange}>→ #{e.new_position}</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
