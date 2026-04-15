import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ApplicantCard from '../components/ApplicantCard';
import AuditLog from '../components/AuditLog';
import styles from './Dashboard.module.css';

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
    <div className={styles.loadingScreen}>
      <div className={styles.spinner} />
      <span>Loading pipeline…</span>
    </div>
  );

  if (!data) return (
    <div className={styles.loadingScreen} style={{ color: 'var(--red)' }}>
      Failed to load pipeline.
    </div>
  );

  const applyUrl = `${window.location.origin}/apply/${jobId}`;
  const fillPct = Math.min(100, Math.round((data.counts.active / data.counts.capacity) * 100));

  return (
    <div className={styles.dbRoot}>
      {/* Top Bar */}
      <div className={styles.dbTopbar}>
        <Link to="/" className={styles.dbTopbarBrand}>⚡ NextInLine</Link>
        <div className={styles.dbTopbarActions}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <span className={styles.dbLiveDot} /> Live · {lastRefresh?.toLocaleTimeString()}
          </span>
          <button id="btn-refresh" className={styles.dbRefreshBtn} onClick={fetchData}>↻ Refresh</button>
        </div>
      </div>

      <div className={styles.dbWrap}>
        {/* Header */}
        <div className={styles.dbHeader}>
          <h1 className={styles.dbJobTitle}>{data.job.title}</h1>
          <div className={styles.dbMetaRow}>
            <span className={styles.dbMetaChip}>🎯 Capacity {data.counts.capacity}</span>
            <span className={styles.dbMetaChip}>⏱ {data.job.acknowledge_window_minutes}min window</span>
            <span className={styles.dbMetaChip}>📉 {data.job.decay_penalty}pos penalty</span>
            <span className={styles.dbMetaChip} style={{ color: data.job.is_open ? 'var(--green)' : 'var(--red)' }}>
              {data.job.is_open ? '● Open' : '● Closed'}
            </span>
          </div>
        </div>

        {/* Share Box */}
        <div className={styles.dbShareBox}>
          <span className={styles.dbShareLabel}>Apply Link</span>
          <a href={applyUrl} target="_blank" rel="noreferrer" className={styles.dbShareUrl}>{applyUrl}</a>
          <button id="btn-copy-link" className={styles.dbCopyBtn} onClick={copyApplyLink}>
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        {/* Stats */}
        <div className={styles.dbStatsRow}>
          <div className={styles.dbStatCard}>
            <div className={styles.dbStatLabel}>Active</div>
            <div className={styles.dbStatValue} style={{ color: 'var(--green)' }}>{data.counts.active}</div>
            <div className={styles.dbStatSub}>of {data.counts.capacity} slots</div>
            <div className={styles.dbStatBar}>
              <div className={styles.dbStatBarFill} style={{ width: `${fillPct}%`, background: 'var(--green)' }} />
            </div>
          </div>
          <div className={styles.dbStatCard}>
            <div className={styles.dbStatLabel}>Pending Ack</div>
            <div className={styles.dbStatValue} style={{ color: 'var(--yellow)' }}>{data.counts.pending}</div>
            <div className={styles.dbStatSub}>awaiting response</div>
          </div>
          <div className={styles.dbStatCard}>
            <div className={styles.dbStatLabel}>Waitlisted</div>
            <div className={styles.dbStatValue} style={{ color: 'var(--purple)' }}>{data.counts.waitlisted}</div>
            <div className={styles.dbStatSub}>in queue</div>
          </div>
          <div className={styles.dbStatCard}>
            <div className={styles.dbStatLabel}>Audit Events</div>
            <div className={styles.dbStatValue}>{audit.length}</div>
            <div className={styles.dbStatSub}>total transitions</div>
          </div>
        </div>

        {/* Pipeline Columns */}
        <div className={styles.dbPipelineGrid}>
          {/* Active */}
          <div className={styles.dbPipelineCol}>
            <div className={styles.dbColHeader}>
              <span className={styles.dbColTitle}>Active Review</span>
              <span className={`${styles.dbColBadge} ${styles.badgeActive}`}>{data.counts.active}</span>
            </div>
            <div className={styles.dbColBody}>
              {data.active.length === 0
                ? <div className={styles.dbEmpty}><span>📭</span>No active applicants</div>
                : data.active.map(a => <ApplicantCard key={a.id} applicant={a} onExit={handleExit} showExit />)
              }
            </div>
          </div>

          {/* Pending */}
          <div className={styles.dbPipelineCol}>
            <div className={styles.dbColHeader}>
              <span className={styles.dbColTitle}>Awaiting Response</span>
              <span className={`${styles.dbColBadge} ${styles.badgePending}`}>{data.counts.pending}</span>
            </div>
            <div className={styles.dbColBody}>
              {data.pending_acknowledgment.length === 0
                ? <div className={styles.dbEmpty}><span>⏳</span>No pending acknowledgments</div>
                : data.pending_acknowledgment.map(a => <ApplicantCard key={a.id} applicant={a} />)
              }
            </div>
          </div>

          {/* Waitlist */}
          <div className={styles.dbPipelineCol}>
            <div className={styles.dbColHeader}>
              <span className={styles.dbColTitle}>Waitlist</span>
              <span className={`${styles.dbColBadge} ${styles.badgeWaitlist}`}>{data.counts.waitlisted}</span>
            </div>
            <div className={styles.dbColBody}>
              {data.waitlist.length === 0
                ? <div className={styles.dbEmpty}><span>🎉</span>Waitlist is empty</div>
                : data.waitlist.map(a => <ApplicantCard key={a.id} applicant={a} />)
              }
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <AuditLog events={audit} />
      </div>
    </div>
  );
}
