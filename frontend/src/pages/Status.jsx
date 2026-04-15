import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CountdownTimer from '../components/CountdownTimer';
import styles from './Status.module.css';

const STATUS_CONFIG = {
  active: {
    icon: '✅', label: 'In Active Review', cls: 'active',
    desc: "Your application is under active consideration. The hiring team will reach out directly."
  },
  pending_acknowledgment: {
    icon: '⏳', label: "Action Required – You've Been Promoted!", cls: 'pending',
    desc: "A slot opened for you. Acknowledge below before the timer runs out or you'll be re-queued with a penalty."
  },
  waitlisted: {
    icon: '📋', label: 'On the Waitlist', cls: 'waitlisted',
    desc: "You're queued and will be automatically promoted when a slot becomes available."
  },
  hired: {
    icon: '🎉', label: "Congratulations — You're Hired!", cls: 'hired',
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

// Map config cls string to the corresponding CSS module class names
const STATUS_BOX_CLS = {
  active:    styles.sActive,
  pending:   styles.sPending,
  waitlisted:styles.sWaitlisted,
  hired:     styles.sHired,
  rejected:  styles.sRejected,
  withdrawn: styles.sWithdrawn,
};
const STATUS_COLOR_CLS = {
  active:    styles.cActive,
  pending:   styles.cPending,
  waitlisted:styles.cWaitlisted,
  hired:     styles.cHired,
  rejected:  styles.cRejected,
  withdrawn: styles.cWithdrawn,
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
    <div className={styles.statusRoot}>
      <div className={styles.statusCard} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className={styles.spinner} />
        Loading your status…
      </div>
    </div>
  );

  if (!data) return (
    <div className={styles.statusRoot}>
      <div className={styles.statusCard} style={{ color: 'var(--red)', textAlign: 'center' }}>
        {err || 'Applicant not found.'}
      </div>
    </div>
  );

  const cfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.waitlisted;

  return (
    <div className={styles.statusRoot}>
      <div className={styles.statusCard}>
        <h2 className={styles.statusGreeting}>Hi, {data.name} 👋</h2>
        <p className={styles.statusEmail}>{data.email}</p>

        {/* Status Box */}
        <div className={`${styles.statusBox} ${STATUS_BOX_CLS[cfg.cls]}`}>
          <div className={styles.statusIconRow}>
            <span className={styles.statusIcon}>{cfg.icon}</span>
            <span className={`${styles.statusLabel} ${STATUS_COLOR_CLS[cfg.cls]}`}>{cfg.label}</span>
          </div>
          <p className={`${styles.statusDesc} ${STATUS_COLOR_CLS[cfg.cls]}`} style={{ opacity: 0.85 }}>{cfg.desc}</p>

          {data.status === 'waitlisted' && (
            <div className={`${styles.statusPositionPill} ${styles.cWaitlisted}`} style={{ background: 'rgba(161,139,250,0.15)' }}>
              # {data.waitlist_position}
            </div>
          )}
        </div>

        {/* Acknowledge Panel */}
        {data.status === 'pending_acknowledgment' && !ackDone && (
          <div className={styles.ackPanel}>
            <p className={styles.ackWarn}>
              ⚠ Respond before the countdown hits zero. Missing the window will return you to the waitlist
              at a penalized position.
            </p>
            <CountdownTimer deadline={data.acknowledge_deadline} />
            <button id="btn-acknowledge" className={styles.btnAck} onClick={acknowledge}>
              ✓ Acknowledge My Promotion
            </button>
            {err && <div className={styles.errBox}>{err}</div>}
          </div>
        )}

        {ackDone && (
          <div className={styles.ackDoneBox}>
            <span style={{ fontSize: 22 }}>✅</span>
            Acknowledged! You're now in active review.
          </div>
        )}

        <button id="btn-refresh-status" className={styles.refreshBtn} onClick={fetchStatus}>
          ↻ Refresh Status
        </button>
      </div>

      <div className={styles.brandLink}>
        Powered by <a href="/">⚡ NextInLine</a>
      </div>
    </div>
  );
}
