import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CountdownTimer from '../components/CountdownTimer';
import { publicGet, publicPost } from '../utils/api';

const STATUS_CONFIG = {
  active: { icon: '✅', label: 'In Active Review', color: '#4ade80', desc: "Your application is under active consideration. The hiring team will reach out directly." },
  pending_acknowledgment: { icon: '⏳', label: "Action Required!", color: '#fbbf24', desc: "A slot opened for you. Acknowledge below before the timer runs out or you'll be re-queued with a penalty." },
  waitlisted: { icon: '📋', label: 'On the Waitlist', color: '#94a3b8', desc: "You're queued and will be automatically promoted when a slot becomes available." },
  hired: { icon: '🎉', label: "You're Hired!", color: '#34d399', desc: "Congratulations! The team has selected you. Expect an official offer soon." },
  rejected: { icon: '📩', label: 'Application Closed', color: '#f87171', desc: "The team has decided not to move forward at this time. Thank you for applying." },
  withdrawn: { icon: '↩', label: 'Withdrawn', color: '#555', desc: "This application has been withdrawn from the pipeline." }
};

export default function Status() {
  const { applicantId } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function fetchStatus() {
    try {
      const r = await publicGet(`/applicants/${applicantId}/status`);
      if (!r.ok) throw new Error('Not found');
      const d = await r.json();
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

  const s = {
    wrap: { minHeight: '100vh', background: '#0a0d14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: { background: '#111827', border: '1px solid #1e2235', borderRadius: 20, padding: 40, width: '100%', maxWidth: 500 },
    logo: { color: '#00d4aa', fontWeight: 800, fontSize: 20, cursor: 'pointer', marginBottom: 32, display: 'block', textAlign: 'center' },
    name: { color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 },
    email: { color: '#555', fontSize: 14, marginBottom: 24 },
    box: (c) => ({ background: '#0d1117', border: `1px solid ${c}44`, borderRadius: 16, padding: 24, marginBottom: 24 }),
    icon: { fontSize: 32, marginBottom: 12, display: 'block' },
    label: (c) => ({ color: c, fontWeight: 800, fontSize: 18, marginBottom: 8, display: 'block' }),
    desc: { color: '#888', fontSize: 14, lineHeight: 1.6 },
    pos: { display: 'inline-block', marginTop: 16, background: '#1e2235', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 },
    ack: { background: '#fbbf24', color: '#000', border: 'none', borderRadius: 10, padding: 14, fontWeight: 800, width: '100%', cursor: 'pointer', marginTop: 20 },
    withdraw: { background: 'transparent', border: '1px solid #333', color: '#555', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginTop: 24, width: '100%' }
  };

  if (loading) return <div style={{ padding: 100, textAlign: 'center', color: '#555' }}>Loading status...</div>;
  if (!data) return <div style={{ padding: 100, textAlign: 'center', color: '#f87171' }}>{err || 'Application not found'}</div>;

  const cfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.waitlisted;

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <span style={s.logo} onClick={() => nav('/')}>■ NextInLine</span>
        <h2 style={s.name}>Hi, {data.name}</h2>
        <p style={s.email}>{data.job_title} · {data.email}</p>

        <div style={s.box(cfg.color)}>
          <span style={s.icon}>{cfg.icon}</span>
          <span style={s.label(cfg.color)}>{cfg.label}</span>
          <p style={s.desc}>{cfg.desc}</p>
          {data.status === 'waitlisted' && (
            <span style={s.pos}>Waitlist Position: #{data.waitlist_position}</span>
          )}
        </div>

        {data.status === 'pending_acknowledgment' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#fbbf24', fontSize: 13, marginBottom: 10, fontWeight: 600 }}>TIME REMAINING TO ACKNOWLEDGE:</p>
            <CountdownTimer deadline={data.acknowledge_deadline} />
            <button style={s.ack} onClick={acknowledge}>Acknowledge Promotion ✓</button>
          </div>
        )}

        {['active', 'waitlisted', 'pending_acknowledgment'].includes(data.status) && (
          <button style={s.withdraw} onClick={withdraw}>Withdraw Application</button>
        )}
      </div>
    </div>
  );
}
