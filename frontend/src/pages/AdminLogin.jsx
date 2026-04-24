import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('adminToken')) nav('/admin/dashboard');
  }, []);

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      const r = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      localStorage.setItem('adminToken', d.token);
      localStorage.setItem('adminData', JSON.stringify(d.admin));
      nav('/admin/dashboard');
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }

  const s = {
    wrap: { minHeight: '100vh', background: '#0a0d14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: { background: '#111827', border: '1px solid #1e2235', borderRadius: 20, padding: 48, width: '100%', maxWidth: 420 },
    logo: { color: '#00d4aa', fontWeight: 800, fontSize: 22, marginBottom: 6, letterSpacing: 1 },
    badge: { display: 'inline-block', background: '#0d2e2a', color: '#00d4aa', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, marginBottom: 28, letterSpacing: 1 },
    h2: { color: '#fff', fontSize: 26, fontWeight: 800, marginBottom: 6 },
    sub: { color: '#555', fontSize: 14, marginBottom: 32 },
    label: { display: 'block', color: '#888', fontSize: 12, fontWeight: 700, marginBottom: 6, letterSpacing: 0.5 },
    input: { width: '100%', padding: '13px 16px', background: '#0d1117', border: '1.5px solid #1e2235', borderRadius: 10, color: '#fff', fontSize: 15, marginBottom: 18, outline: 'none' },
    btn: { width: '100%', padding: 14, background: '#00d4aa', color: '#0a0d14', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 800 },
    err: { background: '#2d0f0f', border: '1px solid #7f1d1d', color: '#f87171', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 18 },
    back: { marginTop: 20, textAlign: 'center', color: '#444', fontSize: 13, cursor: 'pointer' }
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <p style={s.logo}>■ NextInLine</p>
        <span style={s.badge}>ADMIN ACCESS</span>
        <h2 style={s.h2}>Welcome back</h2>
        <p style={s.sub}>Sign in to manage your hiring pipeline</p>
        {err && <div style={s.err}>⚠ {err}</div>}
        <form onSubmit={submit}>
          <label style={s.label}>EMAIL ADDRESS</label>
          <input style={s.input} type="email" placeholder="admin@nextinline.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required autoFocus />
          <label style={s.label}>PASSWORD</label>
          <input style={s.input} type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          <button style={s.btn} disabled={loading}>{loading ? 'Signing in...' : 'Sign In to Dashboard'}</button>
        </form>
        <p style={s.back} onClick={() => nav('/')}>← Back to home</p>
      </div>
    </div>
  );
}
