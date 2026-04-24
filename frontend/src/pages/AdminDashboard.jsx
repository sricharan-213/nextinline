import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', active_capacity: 3, acknowledge_window_minutes: 2, decay_penalty: 5 });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const admin = JSON.parse(localStorage.getItem('adminData') || '{}');

  async function fetchJobs() {
    const r = await api.get('/jobs/admin/all');
    if (!r) return;
    const d = await r.json();
    setJobs(Array.isArray(d) ? d : []);
  }

  useEffect(() => { fetchJobs(); }, []);

  async function createJob(e) {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      const r = await api.post('/jobs', { ...form, active_capacity: Number(form.active_capacity) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setShowForm(false);
      setForm({ title: '', description: '', active_capacity: 3, acknowledge_window_minutes: 2, decay_penalty: 5 });
      fetchJobs();
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }

  function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    nav('/admin/login');
  }

  const s = {
    wrap: { minHeight: '100vh', background: '#0a0d14' },
    nav: { borderBottom: '1px solid #1e2235', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    logo: { color: '#00d4aa', fontWeight: 800, fontSize: 20 },
    navRight: { display: 'flex', alignItems: 'center', gap: 16 },
    adminBadge: { background: '#0d2e2a', color: '#00d4aa', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 },
    logoutBtn: { background: 'transparent', border: '1px solid #333', color: '#888', padding: '6px 14px', borderRadius: 8, fontSize: 13 },
    content: { maxWidth: 1000, margin: '0 auto', padding: '32px 16px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
    h1: { color: '#fff', fontSize: 24, fontWeight: 800 },
    newBtn: { background: '#00d4aa', color: '#0a0d14', border: 'none', borderRadius: 10, padding: '11px 22px', fontWeight: 800, fontSize: 14 },
    formCard: { background: '#111827', border: '1px solid #1e2235', borderRadius: 16, padding: 28, marginBottom: 24 },
    formTitle: { color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 20 },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
    label: { display: 'block', color: '#888', fontSize: 12, fontWeight: 700, marginBottom: 6 },
    input: { width: '100%', padding: '11px 14px', background: '#0d1117', border: '1.5px solid #1e2235', borderRadius: 8, color: '#fff', fontSize: 14, marginBottom: 16 },
    submitBtn: { background: '#00d4aa', color: '#0a0d14', border: 'none', borderRadius: 8, padding: '11px 24px', fontWeight: 800, fontSize: 14 },
    card: { background: '#111827', border: '1px solid #1e2235', borderRadius: 14, padding: 24, marginBottom: 14 },
    jobRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    jobTitle: { color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 6 },
    tags: { display: 'flex', gap: 10, flexWrap: 'wrap' },
    tag: { background: '#0d1117', border: '1px solid #1e2235', color: '#888', fontSize: 12, padding: '4px 12px', borderRadius: 20 },
    activeTag: { background: '#0d2e1f', border: '1px solid #166534', color: '#4ade80', fontSize: 12, padding: '4px 12px', borderRadius: 20 },
    viewBtn: { background: 'transparent', border: '1.5px solid #00d4aa', color: '#00d4aa', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 14 },
    err: { color: '#f87171', fontSize: 13, marginBottom: 12 }
  };

  return (
    <div style={s.wrap}>
      <nav style={s.nav}>
        <span style={s.logo}>■ NextInLine</span>
        <div style={s.navRight}>
          <span style={s.adminBadge}>ADMIN</span>
          <span style={{ color: '#666', fontSize: 13 }}>{admin.email}</span>
          <button style={s.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </nav>

      <div style={s.content}>
        <div style={s.header}>
          <h1 style={s.h1}>Job Openings</h1>
          <button style={s.newBtn} onClick={() => setShowForm(!showForm)}>+ New Job</button>
        </div>

        {showForm && (
          <div style={s.formCard}>
            <p style={s.formTitle}>Create New Job Opening</p>
            {err && <p style={s.err}>{err}</p>}
            <form onSubmit={createJob}>
              <label style={s.label}>JOB TITLE</label>
              <input style={s.input} placeholder="e.g. Senior Backend Engineer" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              <label style={s.label}>DESCRIPTION (optional)</label>
              <input style={s.input} placeholder="Brief description of the role" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <div style={s.row}>
                <div>
                  <label style={s.label}>ACTIVE CAPACITY</label>
                  <input style={s.input} type="number" min="1" value={form.active_capacity} onChange={e => setForm({ ...form, active_capacity: e.target.value })} />
                </div>
                <div>
                  <label style={s.label}>ACK WINDOW (minutes)</label>
                  <input style={s.input} type="number" min="1" value={form.acknowledge_window_minutes} onChange={e => setForm({ ...form, acknowledge_window_minutes: e.target.value })} />
                </div>
                <div>
                  <label style={s.label}>DECAY PENALTY</label>
                  <input style={s.input} type="number" min="1" value={form.decay_penalty} onChange={e => setForm({ ...form, decay_penalty: e.target.value })} />
                </div>
              </div>
              <button style={s.submitBtn} disabled={loading}>{loading ? 'Creating...' : 'Create Job Opening'}</button>
            </form>
          </div>
        )}

        {jobs.map(job => (
          <div key={job.id} style={s.card}>
            <div style={s.jobRow}>
              <div>
                <p style={s.jobTitle}>{job.title}</p>
                {job.description && <p style={{ color: '#555', fontSize: 13, marginBottom: 10 }}>{job.description}</p>}
                <div style={s.tags}>
                  <span style={s.activeTag}>⚡ {job.active_count} active</span>
                  <span style={s.tag}>📋 {job.waitlist_count} waiting</span>
                  <span style={s.tag}>👥 {job.total_applicants} total</span>
                  <span style={s.tag}>Capacity: {job.active_capacity}</span>
                  <span style={{ ...s.tag, color: job.is_open ? '#4ade80' : '#f87171' }}>{job.is_open ? '🟢 Open' : '🔴 Closed'}</span>
                </div>
              </div>
              <button style={s.viewBtn} onClick={() => nav(`/admin/pipeline/${job.id}`)}>
                View Pipeline →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
