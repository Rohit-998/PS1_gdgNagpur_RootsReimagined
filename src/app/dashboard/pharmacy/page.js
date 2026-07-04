'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck, AlertTriangle, XCircle, CheckCircle2,
  Package, QrCode, Clock, TrendingUp, Award, Info
} from 'lucide-react';
import { getStoredUser, buildAuthHeaders } from '@/lib/authHelpers';
import styles from './page.module.css';

export default function PharmacyDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    const token = typeof window !== 'undefined' ? localStorage.getItem('mg_token') : null;
    if (!storedUser || !token) { router.push('/login'); return; }
    if (storedUser.role !== 'pharmacy') { router.push('/dashboard/consumer'); return; }
    setUser(storedUser);

    fetch('/api/dashboard/stats?role=pharmacy', { headers: buildAuthHeaders() })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const verdictColor = (v) =>
    v === 'verified' ? 'var(--color-verified)' : v === 'suspicious' ? 'var(--color-suspicious)' : 'var(--color-danger)';

  if (!user) return null;

  const trustPct = data?.trustPct ?? 100;
  const isTrusted = data?.isTrustedPharmacy ?? true;

  return (
    <div className={`container ${styles.page}`}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 className={styles.title}>Pharmacy Dashboard</h1>
            {isTrusted && (
              <span className={styles.trustBadge}>
                <Award size={14} /> Safe Pharmacy
              </span>
            )}
          </div>
          <p className={styles.subtitle}>
            {user.organization || user.name} · Inventory check mode active — clone score not penalized
          </p>
        </div>
        <Link href="/scan" className={styles.primaryBtn}>
          <QrCode size={16} /> Scan Inventory
        </Link>
      </div>

      {/* Trust Meter */}
      <div className={styles.card}>
        <div className={styles.trustHeader}>
          <div>
            <p className={styles.trustLabel}>Pharmacy Trust Score</p>
            <p className={styles.trustPct} style={{ color: trustPct >= 80 ? 'var(--color-verified)' : trustPct >= 50 ? 'var(--color-suspicious)' : 'var(--color-danger)' }}>
              {trustPct}%
            </p>
            <p className={styles.trustNote}>
              {isTrusted
                ? <><CheckCircle2 size={16} style={{ color: 'var(--color-verified)' }} /> Your pharmacy meets the Safe Pharmacy verification standard</>
                : <><AlertTriangle size={16} style={{ color: 'var(--color-danger)' }} /> Below 80% — verify flagged medicines to improve your score</>}
            </p>
          </div>
          <TrendingUp size={64} style={{ opacity: 0.04 }} />
        </div>
        <div className={styles.trustBar}>
          <div
            className={styles.trustFill}
            style={{
              width: `${trustPct}%`,
              background: trustPct >= 80 ? 'var(--color-verified)' : trustPct >= 50 ? 'var(--color-suspicious)' : 'var(--color-danger)',
            }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <Package size={24} className={styles.statIcon} />
          <p className={styles.statNum}>{data?.totalScans ?? '—'}</p>
          <p className={styles.statLabel}>Total Scans</p>
        </div>
        <div className={styles.statCard}>
          <ShieldCheck size={24} className={styles.statIcon} style={{ color: 'var(--color-verified)' }} />
          <p className={styles.statNum}>{data?.inventoryChecks ?? '—'}</p>
          <p className={styles.statLabel}>Inventory Checks</p>
        </div>
        <div className={styles.statCard}>
          <AlertTriangle size={24} className={styles.statIcon} style={{ color: 'var(--color-danger)' }} />
          <p className={styles.statNum}>{data?.counterfeitAlerts?.length ?? '—'}</p>
          <p className={styles.statLabel}>Alerts</p>
        </div>
      </div>

      {/* Counterfeit Alerts */}
      {data?.counterfeitAlerts?.length > 0 && (
        <div className={`${styles.card} ${styles.alertCard}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}><XCircle size={18} style={{ color: 'var(--color-danger)' }} /> Counterfeit Alerts</h2>
          </div>
          {data.counterfeitAlerts.map((s, i) => (
            <div key={s.id || i} className={styles.alertItem}>
              <XCircle size={18} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p className={styles.alertName}>{s.medicineName}</p>
                <p className={styles.alertMeta}>Batch: {s.batchId} · Score: {s.score}/100 · {new Date(s.scannedAt).toLocaleDateString()}</p>
              </div>
              <Link href="/report" className={styles.reportBtn}>Report</Link>
            </div>
          ))}
        </div>
      )}

      {/* Recent Scans */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}><Clock size={18} /> Recent Inventory Scans</h2>
        </div>
        {loading ? (
          <p style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Loading scans...</p>
        ) : !data?.recentScans?.length ? (
          <p style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            No scans yet. <Link href="/scan" style={{ color: 'var(--color-brand-primary)', fontWeight: 600 }}>Start scanning inventory.</Link>
          </p>
        ) : (
          <div className={styles.scanList}>
            {data.recentScans.map((s, i) => (
              <div key={s.id || i} className={styles.scanRow}>
                <div className={styles.scanBadge} style={{ color: verdictColor(s.verdict) }}>
                  {s.verdict === 'verified' ? <CheckCircle2 size={16} /> : s.verdict === 'suspicious' ? <AlertTriangle size={16} /> : <XCircle size={16} />}
                </div>
                <div className={styles.scanInfo}>
                  <p className={styles.scanName}>{s.medicineName}</p>
                  <p className={styles.scanMeta}>
                    {s.batchId} · {s.city || '—'} · {new Date(s.scannedAt).toLocaleDateString()}
                    {s.scanType === 'inventory_check' && <span className={styles.inventoryTag}><Package size={12} /> Inventory</span>}
                  </p>
                </div>
                <span className={`status-badge badge-${s.verdict}`}>{s.score}/100</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
