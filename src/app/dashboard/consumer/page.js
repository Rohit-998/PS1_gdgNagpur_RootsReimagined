'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  QrCode, History, ShieldCheck, AlertTriangle, Activity,
  CheckCircle2, XCircle, Clock, Mic
} from 'lucide-react';
import { getStoredUser, buildAuthHeaders } from '@/lib/authHelpers';
import styles from './page.module.css';

export default function ConsumerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [localHistory, setLocalHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    const token = typeof window !== 'undefined' ? localStorage.getItem('mg_token') : null;
    if (!storedUser || !token) { router.push('/login'); return; }
    setUser(storedUser);

    // Load local scan history (written by scan page)
    try {
      const hist = JSON.parse(localStorage.getItem('mg_scan_history') || '[]');
      setLocalHistory(hist.slice(0, 20));
    } catch {}

    // Fetch server-side stats
    fetch('/api/dashboard/stats?role=consumer', { headers: buildAuthHeaders() })
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const verdictColor = (v) =>
    v === 'verified' ? 'var(--color-verified)' : v === 'suspicious' ? 'var(--color-suspicious)' : 'var(--color-danger)';
  const verdictIcon = (v) =>
    v === 'verified' ? <CheckCircle2 size={16} /> : v === 'suspicious' ? <AlertTriangle size={16} /> : <XCircle size={16} />;

  if (!user) return null;

  // Merge local history counts
  const localCounts = localHistory.reduce((acc, s) => {
    acc[s.verdict] = (acc[s.verdict] || 0) + 1;
    return acc;
  }, { verified: 0, suspicious: 0, counterfeit: 0 });

  return (
    <div className={`container ${styles.page}`}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, {user.name?.split(' ')[0]}</h1>
          <p className={styles.subtitle}>Your personal medicine verification dashboard</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/scan" className={styles.primaryBtn}>
            <QrCode size={16} /> Scan Medicine
          </Link>
          <Link href="/voice" className={styles.secondaryBtn}>
            <Mic size={16} /> Voice Check
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statVerified}`}>
          <div className={styles.statIcon}><ShieldCheck size={24} /></div>
          <div>
            <p className={styles.statNum}>{localCounts.verified}</p>
            <p className={styles.statLabel}>Verified</p>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statSuspicious}`}>
          <div className={styles.statIcon}><AlertTriangle size={24} /></div>
          <div>
            <p className={styles.statNum}>{localCounts.suspicious}</p>
            <p className={styles.statLabel}>Suspicious</p>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCounterfeit}`}>
          <div className={styles.statIcon}><XCircle size={24} /></div>
          <div>
            <p className={styles.statNum}>{localCounts.counterfeit}</p>
            <p className={styles.statLabel}>Counterfeit</p>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statTotal}`}>
          <div className={styles.statIcon}><Activity size={24} /></div>
          <div>
            <p className={styles.statNum}>{localHistory.length}</p>
            <p className={styles.statLabel}>Total Scans</p>
          </div>
        </div>
      </div>

      {/* Scan History */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}><History size={18} /> Scan History</h2>
          <Link href="/history" className={styles.viewAll}>View All</Link>
        </div>

        {localHistory.length === 0 ? (
          <div className={styles.emptyState}>
            <QrCode size={48} style={{ opacity: 0.3, marginBottom: 16, color: 'var(--color-brand-primary)' }} />
            <p style={{ margin: 0 }}>No scans yet. <Link href="/scan" className={styles.inlineLink}>Start scanning</Link> to verify your medicines.</p>
          </div>
        ) : (
          <div className={styles.scanList}>
            {localHistory.map((scan, i) => (
              <div key={i} className={styles.scanItem}>
                <div className={styles.scanIcon} style={{ color: verdictColor(scan.verdict) }}>
                  {verdictIcon(scan.verdict)}
                </div>
                <div className={styles.scanInfo}>
                  <p className={styles.scanName}>{scan.name || scan.batch}</p>
                  <p className={styles.scanMeta}>
                    <Clock size={12} /> {scan.time ? new Date(scan.time).toLocaleString() : '—'}
                    {scan.batch && <span> · Batch: {scan.batch}</span>}
                  </p>
                </div>
                <div className={styles.scanScore} style={{ color: verdictColor(scan.verdict) }}>
                  <span className={`status-badge badge-${scan.verdict}`}>{scan.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className={styles.quickLinks}>
        <Link href="/interactions" className={styles.quickCard}>
          <Activity size={20} />
          <span>Drug Interactions</span>
        </Link>
        <Link href="/pharmacies" className={styles.quickCard}>
          <ShieldCheck size={20} />
          <span>Trusted Pharmacies</span>
        </Link>
        <Link href="/report" className={styles.quickCard}>
          <AlertTriangle size={20} />
          <span>Report Counterfeit</span>
        </Link>
      </div>
    </div>
  );
}
