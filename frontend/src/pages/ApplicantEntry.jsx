import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicPost } from '../utils/api';

export default function ApplicantEntry() {
  const [form, setForm] = useState({ name: '', email: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('applicant_token')) nav('/applicant/dashboard');
  }, []);

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      const r = await publicPost('/applicants/identify', form);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      
      localStorage.setItem('applicant_token', d.token);
      localStorage.setItem('applicant_name', d.name);
      localStorage.setItem('applicant_email', d.email);
      nav('/applicant/dashboard');
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }

  const s = {
    wrap: { minHeight: '100vh', background: '#0a0d14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: { background: '#111827', border: '1px solid #1e2235', borderRadius: 20, padding: 48, width: '100%', maxWidth: 420 },
    logo: { color: '#00d4aa', fontWeight: 800, fontSize: 24, marginBottom: 8, letterSpacing: 1, textAlign: 'center', display: 'block' },
    h2: { color: '#fff', fontSize: 26, fontWeight: 800, marginBottom: 6, textAlign: 'center' },
    sub: { color: '#555', fontSize: 14, marginBottom: 32, textAlign: 'center' },
    label: { display: 'block', color: '#888', fontSize: 12, fontWeight: 700, marginBottom: 6, letterSpacing: 0.5 },
    input: { width: '100%', padding: '13px 16px', background: '#0d1117', border: '1.5px solid #1e2235', borderRadius: 10, color: '#fff', fontSize: 15, marginBottom: 18, outline: 'none' },
    btn: { width: '100%', padding: 14, background: '#00d4aa', color: '#0a0d14', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: 'pointer' },
    err: { background: '#2d0f0f', border: '1px solid #7f1d1d', color: '#f87171', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 18 },
    back: { marginTop: 24, textAlign: 'center', color: '#444', fontSize: 13, cursor: 'pointer' }
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <span style={s.logo}>■ NextInLine</span>
        <h2 style={s.h2}>Applicant Identity</h2>
        <p style={s.sub}>Enter your details to manage your applications</p>
        
        {err && <div style={s.err}>⚠ {err}</div>}
        
        <form onSubmit={submit}>
          <label style={s.label}>FULL NAME</label>
          <input style={s.input} placeholder="John Smith" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus />
          
          <label style={s.label}>EMAIL ADDRESS</label>
          <input style={s.input} type="email" placeholder="john@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          
          <button style={s.btn} disabled={loading}>{loading ? 'Identifying...' : 'Continue →'}</button>
        </form>
        
        <p style={s.back} onClick={() => nav('/')}>← Back to home</p>
      </div>
    </div>
  );
}
