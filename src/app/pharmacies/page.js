'use client';
import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import styles from './page.module.css';

export default function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetch('/api/pharmacies').then(r => r.json()).then(d => {
      setPharmacies(d.pharmacies || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const badge = (score) => {
    if (score >= 80) return { color: 'var(--color-verified)', bg: 'var(--color-verified-bg)', label: 'Trusted',   Icon: ShieldCheck, isFlagged: false };
    if (score >= 50) return { color: 'var(--color-suspicious)', bg: 'var(--color-suspicious-bg)',  label: 'Caution',   Icon: ShieldAlert, isFlagged: false };
    return              { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)',   label: 'Flagged', Icon: ShieldX, isFlagged: true };
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Pharmacy Trust Leaderboard</h1>
        <p className={styles.subtitle}>Ranked by verification integrity and counterfeit report history.</p>
      </div>

      <div className={styles.list}>
        {loading ? (
          <p className={styles.message}>Loading...</p>
        ) : pharmacies.length === 0 ? (
          <div className={styles.message}>
            No pharmacy data available yet.
          </div>
        ) : pharmacies.map((p, i) => {
          const { color, bg, label, Icon, isFlagged } = badge(p.trust_score);
          return (
            <div key={p._id} className={`${styles.card} ${isFlagged ? styles.cardFlagged : ''}`}>
              <span className={styles.rank}>#{i + 1}</span>
              <div className={styles.info}>
                <p className={styles.name}>{p.name}</p>
                <p className={styles.meta}>{p.city || 'Unknown'} | {p.flagged_count || 0} report(s)</p>
              </div>
              <div className={styles.scoreContainer}>
                <p className={styles.score} style={{ color }}>{p.trust_score}</p>
                <span className={styles.badge} style={{ background: bg, color }}>{label}</span>
              </div>
              <Icon size={24} className={styles.icon} style={{ color }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
