import { useState } from 'react';
import CountdownTimer from './CountdownTimer';

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
  /* compact countdown uses CountdownTimer component — no duplication */
  .deadline-compact { margin-top: 8px; transform: scale(0.85); transform-origin: left; }
`;

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

export default function ApplicantCard({ applicant, onExit, showExit }) {
  const [reason, setReason] = useState('rejected');

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
              <div className="deadline-compact">
                {/* Reuse CountdownTimer — no duplicated countdown logic */}
                <CountdownTimer deadline={applicant.acknowledge_deadline} />
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
