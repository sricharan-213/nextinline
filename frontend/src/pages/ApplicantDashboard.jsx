import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicantApi, publicGet } from '../utils/api';
import CountdownTimer from '../components/CountdownTimer';

const STATUS_CONFIG = {
  active: { label: 'ACTIVE REVIEW', color: '#4ade80', bg: '#0d2e1f', border: '#166534' },
  pending_acknowledgment: { label: 'PENDING ACK', color: '#fbbf24', bg: '#2d240d', border: '#78350f' },
  waitlisted: { label: 'WAITLISTED', color: '#60a5fa', bg: '#0d1e2e', border: '#1e3a8a' },
  hired: { label: 'HIRED ✓', color: '#34d399', bg: '#064e3b', border: '#065f46' },
  rejected: { label: 'REJECTED', color: '#f87171', bg: '#2d0f0f', border: '#7f1d1d' },
  withdrawn: { label: 'WITHDRAWN', color: '#94a3b8', bg: '#1f2937', border: '#374151' }
};

export default function ApplicantDashboard() {
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [tab, setTab] = useState('apps'); // 'apps' or 'browse'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const nav = useNavigate();
  const name = localStorage.getItem('applicant_name');

  async function loadData() {
    try {
      const [appsRes, jobsRes] = await Promise.all([
        applicantApi.get('/applicants/my-applications'),
        publicGet('/jobs')
      ]);
      
      const appsData = await appsRes.json();
      const jobsData = await jobsRes.json();
      
      setApps(Array.isArray(appsData) ? appsData : []);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
    } catch (e) {
      setError('Failed to load dashboard data');
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!localStorage.getItem('applicant_token')) {
      nav('/applicant');
      return;
    }
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  async function handleApply(jobId, jobTitle) {
    if (!confirm(`Apply for ${jobTitle}?`)) return;
    try {
      const r = await applicantApi.post('/applicants/apply', { job_id: jobId });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error);
      }
      setTab('apps');
      loadData();
    } catch (e) { alert(e.message); }
  }

  async function handleAcknowledge(appId) {
    try {
      const r = await fetch(`http://localhost:5000/api/applicants/${appId}/acknowledge`, { method: 'POST' });
      if (r.ok) loadData();
    } catch (e) { alert('Failed to acknowledge'); }
  }

  async function handleWithdraw(appId) {
    if (!confirm('Withdraw this application?')) return;
    try {
      const r = await applicantApi.post(`/applicants/${appId}/withdraw`, {});
      if (r.ok) loadData();
    } catch (e) { alert('Failed to withdraw'); }
  }

  function logout() {
    localStorage.removeItem('applicant_token');
    localStorage.removeItem('applicant_name');
    localStorage.removeItem('applicant_email');
    nav('/');
  }

  const s = {
    wrap: { minHeight: '100vh', background: '#0a0d14' },
    nav: { borderBottom: '1px solid #1e2235', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f1117' },
    logo: { color: '#00d4aa', fontWeight: 800, fontSize: 20 },
    navRight: { display: 'flex', alignItems: 'center', gap: 16 },
    logoutBtn: { background: 'transparent', border: '1px solid #333', color: '#888', padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
    content: { maxWidth: 800, margin: '0 auto', padding: '40px 16px' },
    welcome: { color: '#fff', fontSize: 28, fontWeight: 800, marginBottom: 8 },
    email: { color: '#555', fontSize: 15, marginBottom: 40 },
    tabs: { display: 'flex', gap: 24, borderBottom: '1px solid #1e2235', marginBottom: 32 },
    tab: (active) => ({ padding: '12px 4px', color: active ? '#00d4aa' : '#555', fontSize: 15, fontWeight: 700, cursor: 'pointer', borderBottom: active ? '2px solid #00d4aa' : '2px solid transparent' }),
    card: { background: '#111827', border: '1px solid #1e2235', borderRadius: 16, padding: 24, marginBottom: 16 },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    jobTitle: { color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 4 },
    company: { color: '#555', fontSize: 14 },
    badge: (cfg) => ({ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }),
    btn: { background: '#00d4aa', color: '#0a0d14', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 800, fontSize: 14, cursor: 'pointer' },
    btnSec: { background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
    empty: { textAlign: 'center', padding: '60px 0', color: '#444' },
    waitlist: { color: '#60a5fa', fontWeight: 700, fontSize: 13, marginTop: 8, display: 'block' }
  };

  if (loading) return <div style={{ padding: 100, textAlign: 'center', color: '#555' }}>Loading dashboard...</div>;

  return (
    <div style={s.wrap}>
      <nav style={s.nav}>
        <span style={s.logo}>■ NextInLine</span>
        <div style={s.navRight}>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Hi, {name}</span>
          <button style={s.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </nav>

      <div style={s.content}>
        <h1 style={s.welcome}>Welcome back, {name}</h1>
        <p style={s.email}>{localStorage.getItem('applicant_email')}</p>

        <div style={s.tabs}>
          <span style={s.tab(tab === 'apps')} onClick={() => setTab('apps')}>My Applications</span>
          <span style={s.tab(tab === 'browse')} onClick={() => setTab('browse')}>Browse Jobs</span>
        </div>

        {tab === 'apps' && (
          <div>
            {apps.length === 0 && (
              <div style={s.empty}>
                <p style={{ marginBottom: 20 }}>You haven't applied to anything yet.</p>
                <button style={s.btn} onClick={() => setTab('browse')}>Browse Jobs →</button>
              </div>
            )}
            {apps.map(app => {
              const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.waitlisted;
              return (
                <div key={app.applicant_id} style={s.card}>
                  <div style={s.cardTop}>
                    <div>
                      <p style={s.jobTitle}>{app.job_title}</p>
                      <p style={s.company}>{app.company_name} · Applied {new Date(app.applied_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <span style={s.badge(cfg)}>
                      {cfg.label} {app.status === 'waitlisted' && `#${app.waitlist_position}`}
                    </span>
                  </div>

                  {app.status === 'pending_acknowledgment' && (
                    <div style={{ background: '#2d240d', padding: 16, borderRadius: 12, marginBottom: 16, textAlign: 'center' }}>
                      <p style={{ color: '#fbbf24', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>TIME TO ACKNOWLEDGE:</p>
                      <CountdownTimer deadline={app.acknowledge_deadline} />
                      <button style={{ ...s.btn, background: '#fbbf24', marginTop: 12, width: '100%' }} onClick={() => handleAcknowledge(app.applicant_id)}>
                        Acknowledge Promotion ✓
                      </button>
                    </div>
                  )}

                  {['active', 'waitlisted', 'pending_acknowledgment'].includes(app.status) && (
                    <button style={s.btnSec} onClick={() => handleWithdraw(app.applicant_id)}>Withdraw</button>
                  )}
                  
                  <button style={{ ...s.btnSec, marginLeft: 10 }} onClick={() => nav(`/status/${app.applicant_id}`)}>View Status Page</button>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'browse' && (
          <div>
            {jobs.map(job => {
              const alreadyApplied = apps.some(a => a.job_id === job.id);
              return (
                <div key={job.id} style={s.card}>
                  <div style={s.cardTop}>
                    <div>
                      <p style={s.jobTitle}>{job.title}</p>
                      <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>{job.description}</p>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ color: '#555', fontSize: 12 }}>👥 Capacity: {job.active_capacity}</span>
                        <span style={{ color: '#555', fontSize: 12 }}>📋 {job.waitlist_count} waiting</span>
                      </div>
                    </div>
                    {alreadyApplied ? (
                      <span style={s.badge({ bg: '#1f2937', color: '#94a3b8', border: '#374151' })}>Applied ✓</span>
                    ) : (
                      <button style={s.btn} onClick={() => handleApply(job.id, job.title)}>Apply →</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
