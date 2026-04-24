import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicantApi, publicGet } from '../utils/api';
import CountdownTimer from '../components/CountdownTimer';
import styles from './ApplicantDashboard.module.css';

const STATUS_CONFIG = {
  active:                { label: 'ACTIVE REVIEW',  color: '#4ade80', bg: '#0d2e1f', border: '#166534' },
  pending_acknowledgment:{ label: 'PENDING ACK',    color: '#fbbf24', bg: '#2d240d', border: '#78350f' },
  waitlisted:            { label: 'WAITLISTED',     color: '#60a5fa', bg: '#0d1e2e', border: '#1e3a8a' },
  hired:                 { label: 'HIRED ✓',        color: '#34d399', bg: '#064e3b', border: '#065f46' },
  rejected:              { label: 'REJECTED',       color: '#f87171', bg: '#2d0f0f', border: '#7f1d1d' },
  withdrawn:             { label: 'WITHDRAWN',      color: '#94a3b8', bg: '#1f2937', border: '#374151' }
};

export default function ApplicantDashboard() {
  const [apps, setApps]     = useState([]);
  const [jobs, setJobs]     = useState([]);
  const [tab, setTab]       = useState('apps');
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const name  = localStorage.getItem('applicant_name');
  const email = localStorage.getItem('applicant_email');

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
    } catch (_) {}
    setLoading(false);
  }

  useEffect(() => {
    if (!localStorage.getItem('applicant_token')) { nav('/applicant'); return; }
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  async function handleApply(jobId, jobTitle) {
    if (!confirm(`Apply for ${jobTitle}?`)) return;
    try {
      const r = await applicantApi.post('/applicants/apply', { job_id: jobId });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setTab('apps');
      loadData();
    } catch (e) { alert(e.message); }
  }

  async function handleAcknowledge(appId) {
    try {
      const r = await fetch(`http://localhost:5000/api/applicants/${appId}/acknowledge`, { method: 'POST' });
      if (r.ok) loadData();
    } catch (_) { alert('Failed to acknowledge'); }
  }

  async function handleWithdraw(appId) {
    if (!confirm('Withdraw this application?')) return;
    try {
      const r = await applicantApi.post(`/applicants/${appId}/withdraw`, {});
      if (r.ok) loadData();
    } catch (_) { alert('Failed to withdraw'); }
  }

  function logout() {
    ['applicant_token', 'applicant_name', 'applicant_email'].forEach(k => localStorage.removeItem(k));
    nav('/');
  }

  if (loading) return <div className={styles.loading}>Loading dashboard...</div>;

  return (
    <div className={styles.wrap}>
      <nav className={styles.nav}>
        <span className={styles.logo}>■ NextInLine</span>
        <div className={styles.navRight}>
          <span className={styles.greeting}>Hi, {name}</span>
          <button className={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className={styles.content}>
        <h1 className={styles.welcomeTitle}>Welcome back, {name}</h1>
        <p className={styles.welcomeEmail}>{email}</p>

        <div className={styles.tabs}>
          <span
            className={`${styles.tab} ${tab === 'apps' ? styles.tabActive : ''}`}
            onClick={() => setTab('apps')}
          >My Applications</span>
          <span
            className={`${styles.tab} ${tab === 'browse' ? styles.tabActive : ''}`}
            onClick={() => setTab('browse')}
          >Browse Jobs</span>
        </div>

        {tab === 'apps' && (
          <div>
            {apps.length === 0 && (
              <div className={styles.empty}>
                <p>You haven't applied to anything yet.</p>
                <button className={styles.emptyBtn} onClick={() => setTab('browse')}>Browse Jobs →</button>
              </div>
            )}
            {apps.map(app => {
              const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.waitlisted;
              const badgeStyle = { background: cfg.bg, color: cfg.color, borderColor: cfg.border };
              return (
                <div key={app.applicant_id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div>
                      <p className={styles.jobTitle}>{app.job_title}</p>
                      <p className={styles.jobMeta}>
                        {app.company_name} · Applied {new Date(app.applied_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span className={styles.statusBadge} style={badgeStyle}>
                      {cfg.label}{app.status === 'waitlisted' ? ` #${app.waitlist_position}` : ''}
                    </span>
                  </div>

                  {app.status === 'pending_acknowledgment' && (
                    <div className={styles.ackBox}>
                      <p className={styles.ackLabel}>TIME TO ACKNOWLEDGE:</p>
                      <CountdownTimer deadline={app.acknowledge_deadline} />
                      <button className={styles.ackBtn} onClick={() => handleAcknowledge(app.applicant_id)}>
                        Acknowledge Promotion ✓
                      </button>
                    </div>
                  )}

                  <div className={styles.actionRow}>
                    {['active', 'waitlisted', 'pending_acknowledgment'].includes(app.status) && (
                      <button className={styles.btnSecondary} onClick={() => handleWithdraw(app.applicant_id)}>Withdraw</button>
                    )}
                    <button className={styles.btnSecondary} onClick={() => nav(`/status/${app.applicant_id}`)}>View Status Page</button>
                  </div>
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
                <div key={job.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div>
                      <p className={styles.jobTitle}>{job.title}</p>
                      <p className={styles.jobDesc}>{job.description}</p>
                      <div className={styles.jobStats}>
                        <span className={styles.jobStat}>👥 Capacity: {job.active_capacity}</span>
                        <span className={styles.jobStat}>📋 {job.waitlist_count} waiting</span>
                      </div>
                    </div>
                    {alreadyApplied
                      ? <span className={styles.appliedBadge}>Applied ✓</span>
                      : <button className={styles.applyBtn} onClick={() => handleApply(job.id, job.title)}>Apply →</button>
                    }
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
