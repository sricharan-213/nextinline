import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApplicantCard from '../components/ApplicantCard';
import AuditLog from '../components/AuditLog';
import { api } from '../utils/api';

export default function AdminPipeline() {
  const { jobId } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const admin = JSON.parse(localStorage.getItem('adminData') || '{}');

  const fetchData = useCallback(async () => {
    try {
      const [pipelineRes, logRes] = await Promise.all([
        api.get(`/jobs/${jobId}/pipeline`),
        api.get(`/jobs/${jobId}/audit`)
      ]);

      if (!pipelineRes || !logRes) return;
      if (!pipelineRes.ok) throw new Error('Failed to load pipeline');
      
      const pipeline = await pipelineRes.json();
      const log = await logRes.json();

      setData(pipeline);
      setAudit(Array.isArray(log) ? log : []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [jobId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function handleExit(applicantId, reason) {
    try {
      const res = await api.post(`/applicants/${applicantId}/exit`, { reason });
      if (res && res.ok) fetchData();
    } catch (e) {
      alert(e.message);
    }
  }

  const s = {
    wrap: { minHeight: '100vh', background: '#0a0d14' },
    nav: { borderBottom: '1px solid #1e2235', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    logo: { color: '#00d4aa', fontWeight: 800, fontSize: 20, cursor: 'pointer' },
    content: { maxWidth: 1200, margin: '0 auto', padding: '32px 16px' },
    back: { color: '#555', fontSize: 13, cursor: 'pointer', marginBottom: 20, display: 'inline-block' },
    header: { marginBottom: 32 },
    title: { color: '#fff', fontSize: 28, fontWeight: 800, marginBottom: 8 },
    meta: { display: 'flex', gap: 12 },
    chip: { background: '#111827', border: '1px solid #1e2235', color: '#888', fontSize: 12, padding: '4px 12px', borderRadius: 20 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 40 },
    col: { background: '#0d1117', borderRadius: 16, border: '1px solid #1e2235', overflow: 'hidden' },
    colHead: { padding: '16px 20px', borderBottom: '1px solid #1e2235', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    colTitle: { color: '#fff', fontWeight: 700, fontSize: 15 },
    badge: (c) => ({ background: c, color: '#000', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }),
    colBody: { padding: 12, minHeight: 400 },
    empty: { textAlign: 'center', color: '#333', padding: '40px 0', fontSize: 14 }
  };

  if (loading) return <div style={{ padding: 100, textAlign: 'center', color: '#555' }}>Loading pipeline...</div>;
  if (!data) return <div style={{ padding: 100, textAlign: 'center', color: '#f87171' }}>{error || 'Not found'}</div>;

  return (
    <div style={s.wrap}>
      <nav style={s.nav}>
        <span style={s.logo} onClick={() => nav('/admin/dashboard')}>■ NextInLine</span>
        <span style={{ color: '#666', fontSize: 13 }}>Admin: {admin.email}</span>
      </nav>

      <div style={s.content}>
        <span style={s.back} onClick={() => nav('/admin/dashboard')}>← Back to Dashboard</span>
        <div style={s.header}>
          <h1 style={s.title}>{data.job.title}</h1>
          <div style={s.meta}>
            <span style={s.chip}>👥 Capacity: {data.counts.capacity}</span>
            <span style={s.chip}>⏱ Window: {data.job.acknowledge_window_minutes}m</span>
            <span style={s.chip}>📉 Penalty: {data.job.decay_penalty}</span>
          </div>
        </div>

        <div style={s.grid}>
          <div style={s.col}>
            <div style={s.colHead}>
              <span style={s.colTitle}>ACTIVE REVIEW</span>
              <span style={s.badge('#4ade80')}>{data.counts.active}</span>
            </div>
            <div style={s.colBody}>
              {data.active.length === 0 && <p style={s.empty}>No active applicants</p>}
              {data.active.map(a => <ApplicantCard key={a.id} applicant={a} onExit={handleExit} showExit />)}
            </div>
          </div>

          <div style={s.col}>
            <div style={s.colHead}>
              <span style={s.colTitle}>AWAITING ACK</span>
              <span style={s.badge('#fbbf24')}>{data.counts.pending}</span>
            </div>
            <div style={s.colBody}>
              {data.pending_acknowledgment.length === 0 && <p style={s.empty}>None pending</p>}
              {data.pending_acknowledgment.map(a => <ApplicantCard key={a.id} applicant={a} />)}
            </div>
          </div>

          <div style={s.col}>
            <div style={s.colHead}>
              <span style={s.colTitle}>WAITLIST</span>
              <span style={s.badge('#94a3b8')}>{data.counts.waitlisted}</span>
            </div>
            <div style={s.colBody}>
              {data.waitlist.length === 0 && <p style={s.empty}>Waitlist is empty</p>}
              {data.waitlist.map(a => <ApplicantCard key={a.id} applicant={a} />)}
            </div>
          </div>
        </div>

        <AuditLog events={audit} />
      </div>
    </div>
  );
}
