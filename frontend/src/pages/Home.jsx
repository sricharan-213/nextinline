import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';

export default function Home() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState({ name: '', email: '' });
  const [job, setJob] = useState({ title: '', active_capacity: 3, acknowledge_window_minutes: 60, decay_penalty: 10 });
  const [companyId, setCompanyId] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function createCompany(e) {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      const r = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCompanyId(d.id);
      setStep(2);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }

  async function createJob(e) {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      const r = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...job, company_id: companyId, active_capacity: Number(job.active_capacity) })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      nav(`/dashboard/${d.id}`);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }

  return (
    <div className={styles.homeWrap}>
      <div className={styles.homeLogo}>
        <div className={styles.homeLogoIcon}>⚡</div>
        <span className={styles.homeLogoText}>NextInLine</span>
      </div>
      <p className={styles.homeTagline}>Hiring pipelines that move themselves.</p>

      <div className={styles.homeCard}>
        <div className={styles.homeStepBadge}>
          ● STEP {step} OF 2
        </div>
        <h2>{step === 1 ? 'Create your company' : 'Configure your job posting'}</h2>
        <p>
          {step === 1
            ? 'Set up your hiring organization to get started.'
            : 'Define capacity, acknowledgment window, and decay rules.'}
        </p>

        {err && (
          <div className={styles.errBox}>
            <span>⚠</span> {err}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={createCompany}>
            <label className={styles.fieldLabel}>Company Name</label>
            <input
              id="company-name"
              className={styles.fieldInput}
              placeholder="e.g. Acme Corp"
              value={company.name}
              onChange={e => setCompany({ ...company, name: e.target.value })}
              required
            />
            <label className={styles.fieldLabel}>Company Email</label>
            <input
              id="company-email"
              className={styles.fieldInput}
              type="email"
              placeholder="hiring@acme.com"
              value={company.email}
              onChange={e => setCompany({ ...company, email: e.target.value })}
              required
            />
            <button id="btn-next-step" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Creating…' : 'Continue →'}
            </button>
          </form>
        ) : (
          <form onSubmit={createJob}>
            <label className={styles.fieldLabel}>Job Title</label>
            <input
              id="job-title"
              className={styles.fieldInput}
              placeholder="e.g. Senior Frontend Engineer"
              value={job.title}
              onChange={e => setJob({ ...job, title: e.target.value })}
              required
            />
            <div className={styles.fieldRow}>
              <div>
                <label className={styles.fieldLabel}>Active Capacity</label>
                <input
                  id="job-capacity"
                  className={styles.fieldInput}
                  type="number" min="1"
                  value={job.active_capacity}
                  onChange={e => setJob({ ...job, active_capacity: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={styles.fieldLabel}>Decay Penalty</label>
                <input
                  id="job-decay"
                  className={styles.fieldInput}
                  type="number" min="1"
                  value={job.decay_penalty}
                  onChange={e => setJob({ ...job, decay_penalty: e.target.value })}
                />
              </div>
            </div>
            <label className={styles.fieldLabel}>Acknowledgment Window (minutes)</label>
            <input
              id="job-ack-window"
              className={styles.fieldInput}
              type="number" min="1"
              value={job.acknowledge_window_minutes}
              onChange={e => setJob({ ...job, acknowledge_window_minutes: e.target.value })}
            />
            <p className={styles.fieldHint}>Candidates promoted from waitlist must acknowledge within this window or get penalized.</p>
            <button id="btn-create-job" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Launching…' : '🚀 Create Job & Open Dashboard'}
            </button>
          </form>
        )}

        <div className={styles.stepDots}>
          <div className={`${styles.stepDot} ${step === 1 ? styles.stepDotActive : ''}`} />
          <div className={`${styles.stepDot} ${step === 2 ? styles.stepDotActive : ''}`} />
        </div>
      </div>

      <div className={styles.featuresRow}>
        <div className={styles.featureChip}><span>🔐</span>Advisory Locks</div>
        <div className={styles.featureChip}><span>⏱</span>Auto Decay</div>
        <div className={styles.featureChip}><span>📋</span>Full Audit Log</div>
      </div>
    </div>
  );
}
