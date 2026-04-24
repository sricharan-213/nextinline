import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CountdownTimer from '../components/CountdownTimer';
import { publicGet, publicPost } from '../utils/api';
import styles from './Status.module.css';

const STATUS_CONFIG = {
  active:                { icon: '✅', label: 'In Active Review',   color: '#4ade80', borderColor: '#166534' },
  pending_acknowledgment:{ icon: '⏳', label: 'Action Required!',   color: '#fbbf24', borderColor: '#78350f' },
  waitlisted:            { icon: '📋', label: 'On the Waitlist',    color: '#94a3b8', borderColor: '#374151' },
  hired:                 { icon: '🎉', label: "You're Hired!",      color: '#34d399', borderColor: '#065f46' },
  rejected:              { icon: '📩', label: 'Application Closed', color: '#f87171', borderColor: '#7f1d1d' },
  withdrawn:             { icon: '↩',  label: 'Withdrawn',          color: '#555',    borderColor: '#374151' }
};

const STATUS_DESCRIPTIONS = {
  active:                'Your application is under active consideration. The hiring team will reach out directly.',
  pending_acknowledgment:'A slot opened for you. Acknowledge below before the timer runs out or you\'ll be re-queued with a penalty.',
  waitlisted:            "You're queued and will be automatically promoted when a slot becomes available.",
  hired:                 'Congratulations! The team has selected you. Expect an official offer soon.',
  rejected:              'The team has decided not to move forward at this time. Thank you for applying.',
  withdrawn:             'This application has been withdrawn from the pipeline.'
};

export default function Status() {
  const { applicantId } = useParams();
  const nav = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]       = useState('');

  async function fetchStatus() {
    try {
      const r = await publicGet(`/applicants/${applicantId}/status`);
      if (!r.ok) throw new Error('Not found');
      setData(await r.json());
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [applicantId]);

  async function acknowledge() {
    try {
      await publicPost(`/applicants/${applicantId}/acknowledge`, {});
      fetchStatus();
    } catch (e) { alert(e.message); }
  }

  async function withdraw() {
    if (!confirm('Withdraw your application?')) return;
    try {
      await publicPost(`/applicants/${applicantId}/withdraw`, {});
      fetchStatus();
    } catch (e) { alert(e.message); }
  }

  if (loading) return <div className={styles.wrap}><div className={styles.card} style={{ textAlign: 'center', color: '#555' }}>Loading status...</div></div>;
  if (!data)   return <div className={styles.wrap}><div className={styles.card} style={{ textAlign: 'center', color: '#f87171' }}>{err || 'Application not found'}</div></div>;

  const cfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.waitlisted;
  const desc = STATUS_DESCRIPTIONS[data.status] || '';

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <span className={styles.logo} onClick={() => nav('/')}>■ NextInLine</span>
        <h2 className={styles.name}>Hi, {data.name}</h2>
        <p className={styles.email}>{data.job_title} · {data.email}</p>

        <div className={styles.statusBox} style={{ borderColor: `${cfg.borderColor}44` }}>
          <span className={styles.statusIcon}>{cfg.icon}</span>
          <span className={styles.statusLabel} style={{ color: cfg.color }}>{cfg.label}</span>
          <p className={styles.statusDesc}>{desc}</p>
          {data.status === 'waitlisted' && (
            <span className={styles.positionBadge}>Waitlist Position: #{data.waitlist_position}</span>
          )}
        </div>

        {data.status === 'pending_acknowledgment' && (
          <div className={styles.ackBox}>
            <p className={styles.ackLabel}>TIME REMAINING TO ACKNOWLEDGE:</p>
            <CountdownTimer deadline={data.acknowledge_deadline} />
            <button className={styles.ackBtn} onClick={acknowledge}>Acknowledge Promotion ✓</button>
          </div>
        )}

        {['active', 'waitlisted', 'pending_acknowledgment'].includes(data.status) && (
          <button className={styles.withdrawBtn} onClick={withdraw}>Withdraw Application</button>
        )}
      </div>
    </div>
  );
}
