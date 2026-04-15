import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CountdownTimer from '../components/CountdownTimer';

const css = `
  .status-root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--bg);
  }
  .status-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 36px;
    width: 100%;
    max-width: 460px;
    box-shadow: var(--shadow);
    animation: fadeIn 0.35s ease both;
  }
  .status-greeting {
    font-size: 22px;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 6px;
  }
  .status-email {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 28px;
  }
  .status-box {
    border-radius: 12px;
    padding: 22px;
    margin-bottom: 22px;
    border: 1.5px solid;
  }
  .status-icon-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }
  .status-icon {
    font-size: 26px;
  }
  .status-label {
    font-size: 17px;
    font-weight: 800;
  }
  .status-desc {
    font-size: 14px;
    line-height: 1.6;
    margin-top: 4px;
  }
  .status-position-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 20px;
    padding: 5px 14px;
    font-size: 20px;
    font-weight: 900;
    margin-top: 10px;
  }
  /* Per-status theming */
  .s-active    { background: rgba(34,211,160,0.08); border-color: rgba(34,211,160,0.3); }
  .s-pending   { background: rgba(245,200,66,0.08);  border-color: rgba(245,200,66,0.3); }
  .s-waitlisted{ background: rgba(161,139,250,0.08); border-color: rgba(161,139,250,0.3); }
  .s-hired     { background: rgba(34,211,160,0.12); border-color: rgba(34,211,160,0.4); }
  .s-rejected  { background: rgba(255,91,91,0.08);  border-color: rgba(255,91,91,0.3); }
  .s-withdrawn { background: rgba(107,112,153,0.08); border-color: rgba(107,112,153,0.3); }

  .c-active    { color: var(--green); }
  .c-pending   { color: var(--yellow); }
  .c-waitlisted{ color: var(--purple); }
  .c-hired     { color: var(--green); }
  .c-rejected  { color: var(--red); }
  .c-withdrawn { color: var(--text-muted); }

  .ack-panel {
    background: rgba(245,200,66,0.06);
    border: 1px solid rgba(245,200,66,0.2);
    border-radius: 12px;
    padding: 20px;
    margin-top: 4px;
  }
  .ack-warn {
    font-size: 13px;
    color: #c9a227;
    line-height: 1.6;
    margin-bottom: 14px;
  }
  .btn-ack {
    width: 100%;
    padding: 13px;
    background: linear-gradient(135deg, var(--yellow), #d4a017);
    color: #1a1200;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.02em;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 4px 20px rgba(245,200,66,0.3);
    margin-top: 12px;
  }
  .btn-ack:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 28px rgba(245,200,66,0.45);
  }
  .ack-done-box {
    background: rgba(34,211,160,0.1);
    border: 1px solid rgba(34,211,160,0.25);
    border-radius: 10px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--green);
    font-weight: 700;
    font-size: 15px;
    margin-top: 4px;
  }
  .err-box {
    background: rgba(255,91,91,0.1);
    border: 1px solid rgba(255,91,91,0.3);
    border-radius: 8px;
    padding: 10px 14px;
    color: #ff8080;
    font-size: 13px;
    margin-top: 12px;
  }
  .refresh-btn {
    width: 100%;
    padding: 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-dim);
    font-size: 13px;
    font-weight: 600;
    margin-top: 18px;
    transition: border-color 0.2s;
  }
  .refresh-btn:hover { border-color: var(--blue); color: var(--blue); }
  .brand-link {
    margin-top: 24px;
    font-size: 13px;
    color: var(--text-muted);
    text-align: center;
  }
  .brand-link a { color: var(--blue); font-weight: 600; }
`;

const STATUS_CONFIG = {
  active: {
    icon: '✅', label: 'In Active Review', cls: 'active',
    desc: "Your application is under active consideration. The hiring team will reach out directly."
  },
  pending_acknowledgment: {
    icon: '⏳', label: 'Action Required – You\'ve Been Promoted!', cls: 'pending',
    desc: "A slot opened for you. Acknowledge below before the timer runs out or you'll be re-queued with a penalty."
  },
  waitlisted: {
    icon: '📋', label: 'On the Waitlist', cls: 'waitlisted',
    desc: "You're queued and will be automatically promoted when a slot becomes available."
  },
  hired: {
    icon: '🎉', label: 'Congratulations — You\'re Hired!', cls: 'hired',
    desc: "The team has selected you. Expect an official offer to arrive soon."
  },
  rejected: {
    icon: '📩', label: 'Application Closed', cls: 'rejected',
    desc: "The team has decided not to move forward at this time. Thank you for applying."
  },
  withdrawn: {
    icon: '↩', label: 'Withdrawn', cls: 'withdrawn',
    desc: "This application has been withdrawn from the pipeline."
  }
};

export default function Status() {
  const { applicantId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ackDone, setAckDone] = useState(false);
  const [err, setErr] = useState('');

  async function fetchStatus() {
    setErr('');
    try {
      const r = await fetch(`/api/applicants/${applicantId}/status`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setData(d);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [applicantId]);

  async function acknowledge() {
    setErr('');
    const r = await fetch(`/api/applicants/${applicantId}/acknowledge`, { method: 'POST' });
    const d = await r.json();
    if (!r.ok) { setErr(d.error); return; }
    setAckDone(true);
    fetchStatus();
  }

  if (loading) return (
    <>
      <style>{css}</style>
      <div className="status-root">
        <div className="status-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
          Loading your status…
        </div>
      </div>
    </>
  );

  if (!data) return (
    <>
      <style>{css}</style>
      <div className="status-root">
        <div className="status-card" style={{ color: 'var(--red)', textAlign: 'center' }}>
          {err || 'Applicant not found.'}
        </div>
      </div>
    </>
  );

  const cfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.waitlisted;

  return (
    <>
      <style>{css}</style>
      <div className="status-root">
        <div className="status-card">
          <h2 className="status-greeting">Hi, {data.name} 👋</h2>
          <p className="status-email">{data.email}</p>

          {/* Status Box */}
          <div className={`status-box s-${cfg.cls}`}>
            <div className="status-icon-row">
              <span className="status-icon">{cfg.icon}</span>
              <span className={`status-label c-${cfg.cls}`}>{cfg.label}</span>
            </div>
            <p className={`status-desc c-${cfg.cls}`} style={{ opacity: 0.85 }}>{cfg.desc}</p>

            {data.status === 'waitlisted' && (
              <div className={`status-position-pill c-waitlisted`} style={{ background: 'rgba(161,139,250,0.15)' }}>
                # {data.waitlist_position}
              </div>
            )}
          </div>

          {/* Acknowledge Panel */}
          {data.status === 'pending_acknowledgment' && !ackDone && (
            <div className="ack-panel">
              <p className="ack-warn">
                ⚠ Respond before the countdown hits zero. Missing the window will return you to the waitlist
                at a penalized position.
              </p>
              <CountdownTimer deadline={data.acknowledge_deadline} />
              <button id="btn-acknowledge" className="btn-ack" onClick={acknowledge}>
                ✓ Acknowledge My Promotion
              </button>
              {err && <div className="err-box">{err}</div>}
            </div>
          )}

          {ackDone && (
            <div className="ack-done-box">
              <span style={{ fontSize: 22 }}>✅</span>
              Acknowledged! You're now in active review.
            </div>
          )}

          <button id="btn-refresh-status" className="refresh-btn" onClick={fetchStatus}>
            ↻ Refresh Status
          </button>
        </div>

        <div className="brand-link">
          Powered by <a href="/">⚡ NextInLine</a>
        </div>
      </div>
    </>
  );
}
