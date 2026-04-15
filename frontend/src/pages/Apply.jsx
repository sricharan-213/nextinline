import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const css = `
  .apply-root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,211,160,0.1) 0%, transparent 60%),
                var(--bg);
  }
  .apply-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 40px;
    width: 100%;
    max-width: 440px;
    box-shadow: var(--shadow);
    animation: fadeIn 0.4s ease both;
  }
  .apply-icon {
    width: 52px; height: 52px;
    background: linear-gradient(135deg, rgba(34,211,160,0.2), rgba(79,125,255,0.2));
    border: 1px solid rgba(34,211,160,0.3);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    margin-bottom: 20px;
  }
  .apply-card h1 {
    font-size: 22px;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 6px;
  }
  .apply-card p.sub {
    color: var(--text-muted);
    font-size: 14px;
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
    border-color: var(--green);
    box-shadow: 0 0 0 3px rgba(34,211,160,0.12);
  }
  .field-input::placeholder { color: var(--text-muted); }
  .btn-apply {
    width: 100%;
    padding: 13px;
    background: linear-gradient(135deg, var(--green) 0%, #16a37a 100%);
    color: #0a0b0f;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 700;
    transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
    box-shadow: 0 4px 20px rgba(34,211,160,0.3);
  }
  .btn-apply:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 28px rgba(34,211,160,0.45);
  }
  .btn-apply:disabled { opacity: 0.6; cursor: not-allowed; }
  .err-box {
    background: rgba(255,91,91,0.1);
    border: 1px solid rgba(255,91,91,0.3);
    border-radius: 8px;
    padding: 10px 14px;
    color: #ff8080;
    font-size: 13px;
    margin-bottom: 18px;
  }
  .success-box {
    background: rgba(34,211,160,0.08);
    border: 1px solid rgba(34,211,160,0.25);
    border-radius: 12px;
    padding: 24px;
  }
  .success-icon {
    width: 52px; height: 52px;
    background: rgba(34,211,160,0.15);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    margin-bottom: 16px;
  }
  .success-title {
    font-size: 20px;
    font-weight: 800;
    color: var(--green);
    margin-bottom: 8px;
  }
  .success-body {
    font-size: 14px;
    color: var(--text-dim);
    margin-bottom: 20px;
    line-height: 1.6;
  }
  .btn-status-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-size: 14px;
    font-weight: 600;
    transition: border-color 0.2s;
  }
  .btn-status-link:hover { border-color: var(--blue); color: var(--blue); }
  .waitlist-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(161,139,250,0.15);
    border: 1px solid rgba(161,139,250,0.3);
    color: var(--purple);
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 12px;
  }
`;

export default function Apply() {
  const { jobId } = useParams();
  const [form, setForm] = useState({ name: '', email: '' });
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      const r = await fetch('/api/applicants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, job_id: jobId })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult(d);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }

  if (result) return (
    <>
      <style>{css}</style>
      <div className="apply-root">
        <div className="apply-card">
          <div className="success-box">
            <div className="success-icon">
              {result.status === 'active' ? '✅' : '📋'}
            </div>
            {result.status === 'waitlisted' && (
              <div className="waitlist-badge">#{result.waitlist_position} in queue</div>
            )}
            <h2 className="success-title">
              {result.status === 'active' ? "You're in active review!" : "Added to the waitlist!"}
            </h2>
            <p className="success-body">
              {result.status === 'active'
                ? 'Your application is now under active consideration. The hiring team will reach out soon.'
                : "You'll be automatically promoted when a slot opens. Acknowledge quickly when promoted to protect your position!"}
            </p>
            <Link id="link-check-status" to={`/status/${result.id}`} className="btn-status-link">
              📊 Check my status →
            </Link>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="apply-root">
        <div className="apply-card">
          <div className="apply-icon">📝</div>
          <h1>Apply for this position</h1>
          <p className="sub">Fill in your details to join the hiring pipeline.</p>
          {err && <div className="err-box">⚠ {err}</div>}
          <form onSubmit={submit}>
            <label className="field-label">Full Name</label>
            <input
              id="apply-name"
              className="field-input"
              placeholder="Jane Doe"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <label className="field-label">Email Address</label>
            <input
              id="apply-email"
              className="field-input"
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
            <button id="btn-submit-application" className="btn-apply" disabled={loading}>
              {loading ? 'Submitting…' : '🚀 Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
