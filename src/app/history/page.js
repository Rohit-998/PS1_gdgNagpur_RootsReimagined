'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ShieldAlert, ShieldX, Trash2, ArrowRight } from 'lucide-react';
import styles from './page.module.css';

const verdictStyle = {
  verified:    { color: 'var(--color-verified)', Icon: ShieldCheck  },
  suspicious:  { color: 'var(--color-suspicious)', Icon: ShieldAlert  },
  counterfeit: { color: 'var(--color-danger)', Icon: ShieldX      },
};

export default function HistoryPage() {
  const router  = useRouter();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mg_scan_history');
      setHistory(raw ? JSON.parse(raw) : []);
    } catch { setHistory([]); }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('mg_scan_history');
    setHistory([]);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Scan History</h1>
          <p className={styles.subtitle}>Your last {history.length} medicine verifications</p>
        </div>
        {history.length > 0 && (
          <button onClick={clearHistory} className={styles.clearBtn}>
            <Trash2 size={16} /> Clear
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className={styles.emptyState}>
          <ShieldCheck size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No scans yet</h3>
          <p className={styles.emptyDesc}>Start scanning medicines to build your history.</p>
          <button onClick={() => router.push('/scan')} className={styles.scanBtn}>
            Scan a Medicine
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {history.map((item, i) => {
            const { color, Icon } = verdictStyle[item.verdict] || verdictStyle.suspicious;
            return (
              <div 
                key={i} 
                className={styles.historyItem}
                onClick={() => router.push(`/scan?batch=${encodeURIComponent(item.batch)}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = color}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <Icon size={24} style={{ color, flexShrink: 0 }} />
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemBatch}>{item.batch}</p>
                </div>
                <div className={styles.itemScoreContainer}>
                  <p className={styles.itemScore} style={{ color }}>{item.score}/100</p>
                  <p className={styles.itemDate}>
                    {new Date(item.time).toLocaleDateString()} {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <ArrowRight size={18} className={styles.arrowIcon} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
