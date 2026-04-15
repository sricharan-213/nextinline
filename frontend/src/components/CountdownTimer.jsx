import { useState, useEffect } from 'react';

const css = `
  .countdown-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 0.04em;
    border: 1.5px solid;
    transition: background 0.4s, border-color 0.4s, color 0.4s;
    margin-bottom: 12px;
  }
  .countdown-icon { font-size: 22px; }
  .countdown-ok {
    background: rgba(245,200,66,0.08);
    border-color: rgba(245,200,66,0.3);
    color: var(--yellow);
  }
  .countdown-warn {
    background: rgba(255,140,0,0.1);
    border-color: rgba(255,140,0,0.35);
    color: #ff9d00;
  }
  .countdown-critical {
    background: rgba(255,91,91,0.1);
    border-color: rgba(255,91,91,0.4);
    color: var(--red);
    animation: pulse-ring 1s ease infinite;
  }
  .countdown-expired {
    background: rgba(255,91,91,0.08);
    border-color: rgba(255,91,91,0.3);
    color: var(--red);
    font-size: 16px;
  }
  .countdown-sub {
    font-size: 11px;
    font-weight: 600;
    opacity: 0.7;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    display: block;
    line-height: 1;
  }
`;

export default function CountdownTimer({ deadline }) {
  const [timeLeft, setTimeLeft] = useState({ m: 0, s: 0, total: 1 });

  useEffect(() => {
    function update() {
      const diff = new Date(deadline) - Date.now();
      if (diff <= 0) {
        setTimeLeft({ m: 0, s: 0, total: -1 });
        return;
      }
      setTimeLeft({
        m: Math.floor(diff / 60000),
        s: Math.floor((diff % 60000) / 1000),
        total: diff
      });
    }
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [deadline]);

  const expired = timeLeft.total <= 0;
  const critical = !expired && timeLeft.total < 60 * 1000;       // < 1 min
  const warn     = !expired && timeLeft.total < 5 * 60 * 1000;   // < 5 min

  const cls = expired ? 'countdown-expired'
    : critical ? 'countdown-critical'
    : warn ? 'countdown-warn'
    : 'countdown-ok';

  const icon = expired ? '⛔' : critical ? '🔴' : warn ? '🟡' : '⏱';

  return (
    <>
      <style>{css}</style>
      <div className={`countdown-wrap ${cls}`}>
        <span className="countdown-icon">{icon}</span>
        <div>
          {expired
            ? <span>Window Expired</span>
            : <span>{String(timeLeft.m).padStart(2, '0')}:{String(timeLeft.s).padStart(2, '0')}</span>
          }
          <span className="countdown-sub">
            {expired ? 'Too late to acknowledge' : 'remaining to acknowledge'}
          </span>
        </div>
      </div>
    </>
  );
}
