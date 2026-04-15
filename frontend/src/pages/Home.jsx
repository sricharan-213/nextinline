import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const css = `
  .home-wrap {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(79,125,255,0.18) 0%, transparent 70%),
                var(--bg);
    position: relative;
    overflow: hidden;
  }
  .home-wrap::before {
    content: '';
    position: absolute;
    top: -200px; right: -200px;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(79,125,255,0.08) 0%, transparent 60%);
    pointer-events: none;
  }
  .home-wrap::after {
    content: '';
    position: absolute;
    bottom: -150px; left: -150px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(34,211,160,0.06) 0%, transparent 60%);
    pointer-events: none;
  }
  .home-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .home-logo-icon {
    width: 44px; height: 44px;
    background: linear-gradient(135deg, var(--blue) 0%, var(--purple) 100%);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    box-shadow: 0 4px 20px rgba(79,125,255,0.4);
    animation: pulse-ring 2.5s ease infinite;
  }
  .home-logo-text {
    font-size: 28px;
    font-weight: 800;
    background: linear-gradient(135deg, #fff 30%, var(--blue) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .home-tagline {
    color: var(--text-dim);
    font-size: 16px;
    margin-bottom: 40px;
    text-align: center;
  }
  .home-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 36px;
    width: 100%;
    max-width: 460px;
    box-shadow: 0 8px 48px rgba(0,0,0,0.5);
    position: relative;
    z-index: 1;
    animation: fadeIn 0.4s ease both;
  }
  .home-step-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--blue-glow);
    border: 1px solid rgba(79,125,255,0.25);
    color: var(--blue);
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 20px;
    letter-spacing: 0.03em;
  }
  .home-card h2 {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 6px;
    color: var(--text);
  }
  .home-card p {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 28px;
  }
  .field-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-dim);
    margin-bottom: 6px;
    letter-spacing: 0.02em;
  }
  .field-input {
    width: 100%;
    padding: 11px 14px;
    background: var(--surface2);
    border: 1.5px solid var(--border);
    border-radius: 10px;
    font-size: 14px;
    color: var(--text);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    margin-bottom: 18px;
  }
  .field-input:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(79,125,255,0.15);
  }
  .field-input::placeholder { color: var(--text-muted); }
  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .field-hint {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: -14px;
    margin-bottom: 18px;
  }
  .btn-primary {
    width: 100%;
    padding: 13px;
    background: linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.02em;
    transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
    box-shadow: 0 4px 20px rgba(79,125,255,0.35);
  }
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 28px rgba(79,125,255,0.5);
  }
  .btn-primary:active { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .err-box {
    background: rgba(255,91,91,0.1);
    border: 1px solid rgba(255,91,91,0.3);
    border-radius: 8px;
    padding: 10px 14px;
    color: #ff8080;
    font-size: 13px;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .step-dots {
    display: flex;
    gap: 6px;
    justify-content: center;
    margin-top: 24px;
  }
  .step-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--border);
    transition: background 0.3s, transform 0.3s;
  }
  .step-dot.active {
    background: var(--blue);
    transform: scale(1.3);
  }
  .features-row {
    display: flex;
    gap: 20px;
    margin-top: 32px;
    max-width: 460px;
    width: 100%;
    position: relative;
    z-index: 1;
  }
  .feature-chip {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 14px;
    text-align: center;
    font-size: 12px;
    color: var(--text-dim);
    font-weight: 500;
  }
  .feature-chip span { display: block; font-size: 18px; margin-bottom: 4px; }
`;

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
    <>
      <style>{css}</style>
      <div className="home-wrap">
        <div className="home-logo">
          <div className="home-logo-icon">⚡</div>
          <span className="home-logo-text">NextInLine</span>
        </div>
        <p className="home-tagline">Hiring pipelines that move themselves.</p>

        <div className="home-card">
          <div className="home-step-badge">
            ● STEP {step} OF 2
          </div>
          <h2>{step === 1 ? 'Create your company' : 'Configure your job posting'}</h2>
          <p>
            {step === 1
              ? 'Set up your hiring organization to get started.'
              : 'Define capacity, acknowledgment window, and decay rules.'}
          </p>

          {err && (
            <div className="err-box">
              <span>⚠</span> {err}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={createCompany}>
              <label className="field-label">Company Name</label>
              <input
                id="company-name"
                className="field-input"
                placeholder="e.g. Acme Corp"
                value={company.name}
                onChange={e => setCompany({ ...company, name: e.target.value })}
                required
              />
              <label className="field-label">Company Email</label>
              <input
                id="company-email"
                className="field-input"
                type="email"
                placeholder="hiring@acme.com"
                value={company.email}
                onChange={e => setCompany({ ...company, email: e.target.value })}
                required
              />
              <button id="btn-next-step" className="btn-primary" disabled={loading}>
                {loading ? 'Creating…' : 'Continue →'}
              </button>
            </form>
          ) : (
            <form onSubmit={createJob}>
              <label className="field-label">Job Title</label>
              <input
                id="job-title"
                className="field-input"
                placeholder="e.g. Senior Frontend Engineer"
                value={job.title}
                onChange={e => setJob({ ...job, title: e.target.value })}
                required
              />
              <div className="field-row">
                <div>
                  <label className="field-label">Active Capacity</label>
                  <input
                    id="job-capacity"
                    className="field-input"
                    type="number" min="1"
                    value={job.active_capacity}
                    onChange={e => setJob({ ...job, active_capacity: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Decay Penalty</label>
                  <input
                    id="job-decay"
                    className="field-input"
                    type="number" min="1"
                    value={job.decay_penalty}
                    onChange={e => setJob({ ...job, decay_penalty: e.target.value })}
                  />
                </div>
              </div>
              <label className="field-label">Acknowledgment Window (minutes)</label>
              <input
                id="job-ack-window"
                className="field-input"
                type="number" min="1"
                value={job.acknowledge_window_minutes}
                onChange={e => setJob({ ...job, acknowledge_window_minutes: e.target.value })}
              />
              <p className="field-hint">Candidates promoted from waitlist must acknowledge within this window or get penalized.</p>
              <button id="btn-create-job" className="btn-primary" disabled={loading}>
                {loading ? 'Launching…' : '🚀 Create Job & Open Dashboard'}
              </button>
            </form>
          )}

          <div className="step-dots">
            <div className={`step-dot ${step === 1 ? 'active' : ''}`} />
            <div className={`step-dot ${step === 2 ? 'active' : ''}`} />
          </div>
        </div>

        <div className="features-row">
          <div className="feature-chip"><span>🔐</span>Advisory Locks</div>
          <div className="feature-chip"><span>⏱</span>Auto Decay</div>
          <div className="feature-chip"><span>📋</span>Full Audit Log</div>
        </div>
      </div>
    </>
  );
}
