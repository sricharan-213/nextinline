const css = `
  .audit-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    animation: fadeIn 0.5s ease both;
  }
  .audit-header {
    padding: 18px 22px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .audit-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .audit-count {
    font-size: 12px;
    font-weight: 700;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 2px 10px;
    color: var(--text-dim);
  }
  .audit-table-wrap {
    overflow-x: auto;
    max-height: 420px;
    overflow-y: auto;
  }
  .audit-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .audit-table thead {
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .audit-table th {
    padding: 10px 14px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    background: var(--surface2);
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }
  .audit-table td {
    padding: 10px 14px;
    border-bottom: 1px solid rgba(42,45,62,0.6);
    vertical-align: middle;
    white-space: nowrap;
  }
  .audit-table tr:last-child td { border-bottom: none; }
  .audit-table tr:hover td { background: rgba(255,255,255,0.02); }
  .audit-time {
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    font-size: 12px;
  }
  .audit-applicant {
    font-weight: 600;
    color: var(--text);
  }
  .audit-email {
    font-size: 11px;
    color: var(--text-muted);
  }
  .event-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .ev-applied      { background: rgba(79,125,255,0.15);  color: #7fa6ff; }
  .ev-promoted     { background: rgba(34,211,160,0.12);  color: var(--green); }
  .ev-acknowledged { background: rgba(34,211,160,0.2);   color: #1de8b0; }
  .ev-decayed      { background: rgba(255,91,91,0.12);   color: #ff8080; }
  .ev-withdrawn    { background: rgba(107,112,153,0.15); color: var(--text-muted); }
  .ev-rejected     { background: rgba(255,91,91,0.1);    color: var(--red); }
  .ev-hired        { background: rgba(34,211,160,0.18);  color: var(--green); }
  .ev-requeued     { background: rgba(245,200,66,0.12);  color: var(--yellow); }
  .ev-default      { background: var(--surface2);        color: var(--text-dim); }
  .transition-arrow {
    color: var(--text-muted);
    padding: 0 5px;
  }
  .transition-from { color: var(--text-muted); }
  .transition-to   { color: var(--text); font-weight: 600; }
  .pos-change {
    font-size: 11px;
    color: var(--purple);
    font-weight: 600;
    margin-left: 4px;
  }
  .audit-empty {
    padding: 48px;
    text-align: center;
    color: var(--text-muted);
    font-size: 14px;
  }
  .audit-empty span { display: block; font-size: 32px; margin-bottom: 10px; opacity: 0.3; }
`;

const EVENT_META = {
  applied:      { cls: 'ev-applied',      icon: '📥' },
  promoted:     { cls: 'ev-promoted',     icon: '⬆' },
  acknowledged: { cls: 'ev-acknowledged', icon: '✅' },
  decayed:      { cls: 'ev-decayed',      icon: '📉' },
  withdrawn:    { cls: 'ev-withdrawn',    icon: '↩' },
  rejected:     { cls: 'ev-rejected',     icon: '❌' },
  hired:        { cls: 'ev-hired',        icon: '🎉' },
  requeued:     { cls: 'ev-requeued',     icon: '🔄' },
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
    <>
      <style>{css}</style>
      <div className="audit-wrap">
        <div className="audit-header">
          <span className="audit-title">
            📜 Audit Log
          </span>
          <span className="audit-count">{events.length} events</span>
        </div>

        {events.length === 0 ? (
          <div className="audit-empty">
            <span>📋</span>
            No events recorded yet. Apply to this job to see the pipeline in action.
          </div>
        ) : (
          <div className="audit-table-wrap">
            <table className="audit-table">
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
                  const meta = EVENT_META[e.event] || { cls: 'ev-default', icon: '•' };
                  return (
                    <tr key={e.id}>
                      <td className="audit-time">
                        <div>{formatTime(e.created_at)}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{formatDate(e.created_at)}</div>
                      </td>
                      <td>
                        <div className="audit-applicant">{e.applicant_name || '—'}</div>
                        {e.applicant_email && <div className="audit-email">{e.applicant_email}</div>}
                      </td>
                      <td>
                        <span className={`event-chip ${meta.cls}`}>
                          {meta.icon} {e.event}
                        </span>
                      </td>
                      <td>
                        {e.old_status && e.new_status ? (
                          <span>
                            <span className="transition-from">{e.old_status}</span>
                            <span className="transition-arrow">→</span>
                            <span className="transition-to">{e.new_status}</span>
                          </span>
                        ) : e.new_status ? (
                          <span className="transition-to">{e.new_status}</span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td>
                        {e.new_position != null
                          ? <span className="pos-change">→ #{e.new_position}</span>
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
    </>
  );
}
