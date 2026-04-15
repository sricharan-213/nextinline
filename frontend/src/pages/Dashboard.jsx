import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ApplicantCard from '../components/ApplicantCard';
import AuditLog from '../components/AuditLog';

const css = `
  .db-root {
    min-height: 100vh;
    background: var(--bg);
  }
  .db-topbar {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 0 32px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(12px);
  }
  .db-topbar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 800;
    font-size: 18px;
    background: linear-gradient(135deg, #fff 30%, var(--blue) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .db-topbar-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .db-refresh-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-dim);
    font-size: 13px;
    font-weight: 600;
    transition: border-color 0.2s, color 0.2s;
  }
  .db-refresh-btn:hover { border-color: var(--blue); color: var(--blue); }
  .db-live-dot {
    width: 8px; height: 8px;
    background: var(--green);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--green);
    animation: pulse-ring 2s ease infinite;
    display: inline-block;
  }
  .db-wrap {
    max-width: 1280px;
    margin: 0 auto;
    padding: 28px 24px;
  }
  .db-header {
    margin-bottom: 28px;
    animation: fadeIn 0.35s ease both;
  }
  .db-job-title {
    font-size: 26px;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 8px;
  }
  .db-meta-row {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .db-meta-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 12px;
    color: var(--text-dim);
    font-weight: 500;
  }
  .db-share-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 28px;
    animation: fadeIn 0.4s ease both;
  }
  .db-share-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .db-share-url {
    flex: 1;
    font-size: 13px;
    color: var(--blue);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .db-copy-btn {
    padding: 5px 12px;
    background: var(--blue-glow);
    border: 1px solid rgba(79,125,255,0.3);
    border-radius: 6px;
    color: var(--blue);
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    transition: background 0.2s;
  }
  .db-copy-btn:hover { background: rgba(79,125,255,0.2); }
  .db-stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 28px;
  }
  .db-stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px 20px;
    animation: fadeIn 0.4s ease both;
    transition: border-color 0.25s, transform 0.25s;
  }
  .db-stat-card:hover { border-color: rgba(79,125,255,0.3); transform: translateY(-2px); }
  .db-stat-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 6px;
  }
  .db-stat-value {
    font-size: 28px;
    font-weight: 800;
    color: var(--text);
    line-height: 1;
  }
  .db-stat-sub {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 4px;
  }
  .db-stat-bar {
    height: 3px;
    background: var(--border);
    border-radius: 2px;
    margin-top: 10px;
    overflow: hidden;
  }
  .db-stat-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.5s ease;
  }
  .db-pipeline-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
    margin-bottom: 28px;
  }
  .db-pipeline-col {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    animation: fadeIn 0.4s ease both;
  }
  .db-col-header {
    padding: 16px 18px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .db-col-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .db-col-badge {
    font-size: 12px;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 20px;
  }
  .badge-active   { background: rgba(34,211,160,0.15); color: var(--green); }
  .badge-pending  { background: rgba(245,200,66,0.15);  color: var(--yellow); }
  .badge-waitlist { background: rgba(161,139,250,0.15); color: var(--purple); }
  .db-col-body {
    padding: 14px;
    min-height: 160px;
  }
  .db-empty {
    text-align: center;
    padding: 32px 0;
    color: var(--text-muted);
    font-size: 13px;
  }
  .db-empty span { display: block; font-size: 28px; margin-bottom: 8px; opacity: 0.4; }
  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 16px;
    color: var(--text-muted);
  }
  .spinner {
    width: 36px; height: 36px;
    border: 3px solid var(--border);
    border-top-color: var(--blue);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @media (max-width: 900px) {
    .db-pipeline-grid { grid-template-columns: 1fr; }
    .db-stats-row { grid-template-columns: repeat(2, 1fr); }
    .db-topbar { padding: 0 16px; }
    .db-wrap { padding: 16px; }
  }
`;

export default function Dashboard() {
  const { jobId } = useParams();
  const [data, setData] = useState(null);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [pipeline, log] = await Promise.all([
        fetch(`/api/jobs/${jobId}/pipeline`).then(r => r.json()),
        fetch(`/api/jobs/${jobId}/audit`).then(r => r.json())
      ]);
      setData(pipeline);
      setAudit(Array.isArray(log) ? log : []);
      setLastRefresh(new Date());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [jobId]);

  useEffect(() => {
    fetchData();
    // Deliberate polling every 10s — chosen over WebSockets to keep the stack simple
    // and because this pipeline does not require sub-second updates.
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function handleExit(applicantId, reason) {
    await fetch(`/api/applicants/${applicantId}/exit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    fetchData();
  }

  function copyApplyLink() {
    navigator.clipboard.writeText(applyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <>
      <style>{css}</style>
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading pipeline…</span>
      </div>
    </>
  );

  if (!data) return (
    <>
      <style>{css}</style>
      <div className="loading-screen" style={{ color: 'var(--red)' }}>Failed to load pipeline.</div>
    </>
  );

  const applyUrl = `${window.location.origin}/apply/${jobId}`;
  const fillPct = Math.min(100, Math.round((data.counts.active / data.counts.capacity) * 100));

  return (
    <>
      <style>{css}</style>
      <div className="db-root">
        {/* Top Bar */}
        <div className="db-topbar">
          <Link to="/" className="db-topbar-brand">⚡ NextInLine</Link>
          <div className="db-topbar-actions">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <span className="db-live-dot" /> Live · {lastRefresh?.toLocaleTimeString()}
            </span>
            <button id="btn-refresh" className="db-refresh-btn" onClick={fetchData}>↻ Refresh</button>
          </div>
        </div>

        <div className="db-wrap">
          {/* Header */}
          <div className="db-header">
            <h1 className="db-job-title">{data.job.title}</h1>
            <div className="db-meta-row">
              <span className="db-meta-chip">🎯 Capacity {data.counts.capacity}</span>
              <span className="db-meta-chip">⏱ {data.job.acknowledge_window_minutes}min window</span>
              <span className="db-meta-chip">📉 {data.job.decay_penalty}pos penalty</span>
              <span className="db-meta-chip" style={{ color: data.job.is_open ? 'var(--green)' : 'var(--red)' }}>
                {data.job.is_open ? '● Open' : '● Closed'}
              </span>
            </div>
          </div>

          {/* Share Box */}
          <div className="db-share-box">
            <span className="db-share-label">Apply Link</span>
            <a href={applyUrl} target="_blank" rel="noreferrer" className="db-share-url">{applyUrl}</a>
            <button id="btn-copy-link" className="db-copy-btn" onClick={copyApplyLink}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>

          {/* Stats */}
          <div className="db-stats-row">
            <div className="db-stat-card">
              <div className="db-stat-label">Active</div>
              <div className="db-stat-value" style={{ color: 'var(--green)' }}>{data.counts.active}</div>
              <div className="db-stat-sub">of {data.counts.capacity} slots</div>
              <div className="db-stat-bar">
                <div className="db-stat-bar-fill" style={{ width: `${fillPct}%`, background: 'var(--green)' }} />
              </div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Pending Ack</div>
              <div className="db-stat-value" style={{ color: 'var(--yellow)' }}>{data.counts.pending}</div>
              <div className="db-stat-sub">awaiting response</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Waitlisted</div>
              <div className="db-stat-value" style={{ color: 'var(--purple)' }}>{data.counts.waitlisted}</div>
              <div className="db-stat-sub">in queue</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Audit Events</div>
              <div className="db-stat-value">{audit.length}</div>
              <div className="db-stat-sub">total transitions</div>
            </div>
          </div>

          {/* Pipeline Columns */}
          <div className="db-pipeline-grid">
            {/* Active */}
            <div className="db-pipeline-col">
              <div className="db-col-header">
                <span className="db-col-title">Active Review</span>
                <span className="db-col-badge badge-active">{data.counts.active}</span>
              </div>
              <div className="db-col-body">
                {data.active.length === 0
                  ? <div className="db-empty"><span>📭</span>No active applicants</div>
                  : data.active.map(a => <ApplicantCard key={a.id} applicant={a} onExit={handleExit} showExit />)
                }
              </div>
            </div>

            {/* Pending */}
            <div className="db-pipeline-col">
              <div className="db-col-header">
                <span className="db-col-title">Awaiting Response</span>
                <span className="db-col-badge badge-pending">{data.counts.pending}</span>
              </div>
              <div className="db-col-body">
                {data.pending_acknowledgment.length === 0
                  ? <div className="db-empty"><span>⏳</span>No pending acknowledgments</div>
                  : data.pending_acknowledgment.map(a => <ApplicantCard key={a.id} applicant={a} />)
                }
              </div>
            </div>

            {/* Waitlist */}
            <div className="db-pipeline-col">
              <div className="db-col-header">
                <span className="db-col-title">Waitlist</span>
                <span className="db-col-badge badge-waitlist">{data.counts.waitlisted}</span>
              </div>
              <div className="db-col-body">
                {data.waitlist.length === 0
                  ? <div className="db-empty"><span>🎉</span>Waitlist is empty</div>
                  : data.waitlist.map(a => <ApplicantCard key={a.id} applicant={a} />)
                }
              </div>
            </div>
          </div>

          {/* Audit Log */}
          <AuditLog events={audit} />
        </div>
      </div>
    </>
  );
}
