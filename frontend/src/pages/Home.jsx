import { useNavigate } from 'react-router-dom';

export default function Home() {
  const nav = useNavigate();

  const s = {
    wrap: { minHeight: '100vh', background: '#0a0d14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 },
    logo: { color: '#00d4aa', fontWeight: 800, fontSize: 36, marginBottom: 8, letterSpacing: 2 },
    tagline: { color: '#555', fontSize: 16, marginBottom: 64, letterSpacing: 1 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 720, width: '100%' },
    card: { background: '#111827', border: '1px solid #1e2235', borderRadius: 20, padding: 40, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' },
    iconWrap: { width: 64, height: 64, borderRadius: '50%', background: '#0d2e2a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
    cardTitle: { color: '#fff', fontWeight: 800, fontSize: 22, marginBottom: 10 },
    cardDesc: { color: '#666', fontSize: 14, lineHeight: 1.7, marginBottom: 28 },
    cardBtn: (primary) => ({ display: 'block', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15, background: primary ? '#00d4aa' : 'transparent', color: primary ? '#0a0d14' : '#00d4aa', border: primary ? 'none' : '1.5px solid #00d4aa' }),
    adminLink: { marginTop: 48, color: '#333', fontSize: 13 },
    adminA: { color: '#555', cursor: 'pointer', marginLeft: 6 }
  };

  return (
    <div style={s.wrap}>
      <p style={s.logo}>■ NextInLine</p>
      <p style={s.tagline}>The Self-Moving Hiring Pipeline</p>

      <div style={s.grid}>
        {/* APPLICANT CARD */}
        <div style={s.card} onClick={() => nav('/applicant')}>
          <div style={s.iconWrap}>
            <svg width="28" height="28" fill="none" stroke="#00d4aa" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
          <p style={s.cardTitle}>I'm an Applicant</p>
          <p style={s.cardDesc}>Manage your applications and track your status in real-time. No password or registration required. Just your name and email.</p>
          <span style={s.cardBtn(true)}>Manage Applications →</span>
        </div>

        {/* COMPANY CARD */}
        <div style={s.card} onClick={() => nav('/admin/login')}>
          <div style={s.iconWrap}>
            <svg width="28" height="28" fill="none" stroke="#00d4aa" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
            </svg>
          </div>
          <p style={s.cardTitle}>I'm a Hiring Manager</p>
          <p style={s.cardDesc}>Manage your pipeline, review applicants, post new jobs, and let the system handle promotions automatically.</p>
          <span style={s.cardBtn(false)}>Admin Login →</span>
        </div>
      </div>

      <p style={s.adminLink}>
        Need to find your application?
        <span style={s.adminA} onClick={() => nav('/applicant')}>Identify yourself here</span>
      </p>
    </div>
  );
}
