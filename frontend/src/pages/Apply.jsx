import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from './Apply.module.css';

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
    <div className={styles.applyRoot}>
      <div className={styles.applyCard}>
        <div className={styles.successBox}>
          <div className={styles.successIcon}>
            {result.status === 'active' ? '✅' : '📋'}
          </div>
          {result.status === 'waitlisted' && (
            <div className={styles.waitlistBadge}>#{result.waitlist_position} in queue</div>
          )}
          <h2 className={styles.successTitle}>
            {result.status === 'active' ? "You're in active review!" : "Added to the waitlist!"}
          </h2>
          <p className={styles.successBody}>
            {result.status === 'active'
              ? 'Your application is now under active consideration. The hiring team will reach out soon.'
              : "You'll be automatically promoted when a slot opens. Acknowledge quickly when promoted to protect your position!"}
          </p>
          <Link id="link-check-status" to={`/status/${result.id}`} className={styles.btnStatusLink}>
            📊 Check my status →
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.applyRoot}>
      <div className={styles.applyCard}>
        <div className={styles.applyIcon}>📝</div>
        <h1>Apply for this position</h1>
        <p className="sub">Fill in your details to join the hiring pipeline.</p>
        {err && <div className={styles.errBox}>⚠ {err}</div>}
        <form onSubmit={submit}>
          <label className={styles.fieldLabel}>Full Name</label>
          <input
            id="apply-name"
            className={styles.fieldInput}
            placeholder="Jane Doe"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <label className={styles.fieldLabel}>Email Address</label>
          <input
            id="apply-email"
            className={styles.fieldInput}
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <button id="btn-submit-application" className={styles.btnApply} disabled={loading}>
            {loading ? 'Submitting…' : '🚀 Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
