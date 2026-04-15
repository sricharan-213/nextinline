import { useState, useEffect } from 'react';
import styles from './CountdownTimer.module.css';

export default function CountdownTimer({ deadline }) {
  const [timeLeft, setTimeLeft] = useState({ m: 0, s: 0, total: 1 });

  useEffect(() => {
    function update() {
      const diff = new Date(deadline) - Date.now();
      if (diff <= 0) { setTimeLeft({ m: 0, s: 0, total: -1 }); return; }
      setTimeLeft({ m: Math.floor(diff / 60000), s: Math.floor((diff % 60000) / 1000), total: diff });
    }
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [deadline]);

  const expired  = timeLeft.total <= 0;
  const critical = !expired && timeLeft.total < 60 * 1000;
  const warn     = !expired && timeLeft.total < 5 * 60 * 1000;

  const phase = expired ? styles.expired : critical ? styles.critical : warn ? styles.warn : styles.ok;
  const icon  = expired ? '⛔' : critical ? '🔴' : warn ? '🟡' : '⏱';

  return (
    <div className={`${styles.wrap} ${phase}`} data-testid="countdown-timer">
      <span className={styles.icon}>{icon}</span>
      <div>
        {expired
          ? <span>Window Expired</span>
          : <span>{String(timeLeft.m).padStart(2,'0')}:{String(timeLeft.s).padStart(2,'0')}</span>
        }
        <span className={styles.sub}>
          {expired ? 'Too late to acknowledge' : 'remaining to acknowledge'}
        </span>
      </div>
    </div>
  );
}
