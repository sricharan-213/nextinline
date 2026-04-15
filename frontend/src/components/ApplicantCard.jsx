import { useState } from 'react';

const css = `
  .acard {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 13px 14px;
    margin-bottom: 10px;
    transition: border-color 0.2s, transform 0.2s;
    animation: fadeIn 0.3s ease both;
  }
  .acard:hover { border-color: rgba(79,125,255,0.3); transform: translateX(2px); }
  .acard-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }
  .acard-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 2px;
  }
  .acard-email {
    font-size: 12px;
    color: var(--text-muted);
  }
  .acard-meta {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 6px;
  }
  .pos-badge {
    background: rgba(161,139,250,0.2);
    color: var(--purple);
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 13px;
    font-weight: 800;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .pending-badge {
    background: rgba(245,200,66,0.15);
    color: var(--yellow);
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .exit-row {
    display: flex;
    gap: 8px;
    margin-top: 11px;
    padding-top: 11px;
    border-top: 1px solid var(--border);
  }
  .exit-select {
    flex: 1;
    padding: 6px 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 7px;
    color: var(--text);
    font-size: 13px;
    outline: none;
    cursor: pointer;
  }
  .exit-select:focus { border-color: var(--blue); }
  .exit-btn {
    padding: 6px 14px;
    background: rgba(255,91,91,0.1);
    border: 1px solid rgba(255,91,91,0.3);
    border-radius: 7px;
    color: #ff8080;
    font-size: 13px;
    font-weight: 700;
    transition: background 0.2s;
  }
  .exit-btn:hover { background: rgba(255,91,91,0.2); }
  .deadline-mini {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--yellow);
    margin-top: 5px;
    font-weight: 600;
  }
`;

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

function miniCountdown(deadline) {
  if (!deadline) return null;
  const diff = new Date(deadline) - Date.now();
  if (diff <= 0) return 'Expired';
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}m ${s}s`;
}

export default function ApplicantCard({ applicant, onExit, showExit }) {
  const [reason, setReason] = useState('rejected');
  const [tick, setTick] = useState(0);

  // Re-render every second only if deadline exists
  useState(() => {
    if (!applicant.acknowledge_deadline) return;
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  });

  return (
    <>
      <style>{css}</style>
      <div className="acard">
        <div className="acard-top">
          <div>
            <p className="acard-name">{applicant.name}</p>
            <p className="acard-email">{applicant.email}</p>
            <p className="acard-meta">Updated {timeAgo(applicant.updated_at)}</p>
            {applicant.acknowledge_deadline && (
              <div className="deadline-mini">
                ⏱ {miniCountdown(applicant.acknowledge_deadline)}
              </div>
            )}
          </div>
          {applicant.status === 'waitlisted' && (
            <span className="pos-badge">#{applicant.waitlist_position}</span>
          )}
          {applicant.status === 'pending_acknowledgment' && (
            <span className="pending-badge">⏳ Pending</span>
          )}
        </div>

        {showExit && (
          <div className="exit-row">
            <select
              className="exit-select"
              value={reason}
              onChange={e => setReason(e.target.value)}
            >
              <option value="rejected">Rejected</option>
              <option value="hired">Hired ✓</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
            <button
              id={`btn-exit-${applicant.id}`}
              className="exit-btn"
              onClick={() => onExit(applicant.id, reason)}
            >
              Exit
            </button>
          </div>
        )}
      </div>
    </>
  );
}
