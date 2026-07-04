'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  QrCode, Package, AlertTriangle, XCircle, CheckCircle2,
  Download, MapPin, List, Loader2, ShieldOff, Truck, LayoutDashboard
} from 'lucide-react';
import { getStoredUser, buildAuthHeaders } from '@/lib/authHelpers';
import SupplyChainTracker from '@/components/supplychain/SupplyChainTracker';
import styles from './page.module.css';

// Leaflet map for global scan locations (SSR-disabled)
const GeoMap = dynamic(() => import('@/components/GeoMap'), { ssr: false });

export default function CompanyDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [qrResult, setQrResult] = useState(null);
  const [qrError, setQrError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [form, setForm] = useState({
    name: '', batch_id: '', serial_number: '', authorized_region: '',
    mfg_date: '', exp_date: '', category: '', strength: '', dosage: '',
    instructions: '', side_effects: '',
  });

  useEffect(() => {
    const storedUser = getStoredUser();
    const token = typeof window !== 'undefined' ? localStorage.getItem('mg_token') : null;
    if (!storedUser || !token) { router.push('/login'); return; }
    if (storedUser.role !== 'manufacturer' && storedUser.role !== 'regulator') {
      router.push('/dashboard/consumer'); return;
    }
    setUser(storedUser);

    fetch('/api/dashboard/stats?role=manufacturer', { headers: buildAuthHeaders() })
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setQrResult(null);
    setQrError('');
    try {
      const res = await fetch('/api/dashboard/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...buildAuthHeaders() },
        body: JSON.stringify({
          ...form,
          side_effects: form.side_effects ? form.side_effects.split(',').map(s => s.trim()) : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate QR');
      setQrResult(data);
    } catch (err) {
      setQrError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const downloadQR = () => {
    if (!qrResult?.qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrResult.qrDataUrl;
    a.download = `safedose-${qrResult.batch_id}-${qrResult.serial_number}.png`;
    a.click();
  };

  if (!user) return null;

  return (
    <div className={`container ${styles.page}`}>
      {/* Tab Switcher */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === 'dashboard' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={16} /> Dashboard
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'supplychain' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('supplychain')}
        >
          <Truck size={16} /> Supply Chain
        </button>
      </div>

      {/* Supply Chain Tab */}
      {activeTab === 'supplychain' && (
        <>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Supply Chain</h1>
              <p className={styles.subtitle}>Track medicine batches across every checkpoint in real time</p>
            </div>
          </div>
          <SupplyChainTracker />
        </>
      )}

      {/* Dashboard Tab (existing content) */}
      {activeTab === 'dashboard' && (
      <>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Manufacturer Dashboard</h1>
          <p className={styles.subtitle}>{user.organization || user.name} · Generate QR codes and track global scans</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.miniStat}>
            <Package size={16} />
            <span>{stats?.totalMedicines ?? '—'} Medicines</span>
          </div>
          <div className={styles.miniStat}>
            <List size={16} />
            <span>{stats?.totalScans ?? '—'} Total Scans</span>
          </div>
        </div>
      </div>

      {/* Verdict Summary */}
      <div className={styles.statsRow}>
        {[
          { label: 'Verified', key: 'verified', icon: <CheckCircle2 size={24} />, color: 'var(--color-verified)' },
          { label: 'Suspicious', key: 'suspicious', icon: <AlertTriangle size={24} />, color: 'var(--color-suspicious)' },
          { label: 'Counterfeit', key: 'counterfeit', icon: <XCircle size={24} />, color: 'var(--color-danger)' },
        ].map(({ label, key, icon, color }) => (
          <div key={key} className={styles.statCard}>
            <div style={{ color }}>{icon}</div>
            <p className={styles.statNum} style={{ color }}>{stats?.verdictCounts?.[key] ?? '—'}</p>
            <p className={styles.statLabel}>{label} Scans</p>
          </div>
        ))}
      </div>

      <div className={styles.twoCols}>
        {/* QR Generator */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}><QrCode size={18} /> Generate Signed QR Code</h2>
          </div>
          <form onSubmit={handleGenerate} className={styles.qrForm}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Medicine Name *</label>
                <input className={styles.input} required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Paracetamol 500mg" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Batch ID *</label>
                <input className={styles.input} required value={form.batch_id} onChange={e => setForm(p => ({ ...p, batch_id: e.target.value }))} placeholder="e.g. BATCH-SUN-2024-001" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Serial Number *</label>
                <input className={styles.input} required value={form.serial_number} onChange={e => setForm(p => ({ ...p, serial_number: e.target.value }))} placeholder="e.g. SN-0001" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Authorized Region *</label>
                <input className={styles.input} required value={form.authorized_region} onChange={e => setForm(p => ({ ...p, authorized_region: e.target.value }))} placeholder="e.g. Maharashtra" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Mfg Date *</label>
                <input className={styles.input} required type="date" value={form.mfg_date} onChange={e => setForm(p => ({ ...p, mfg_date: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Exp Date *</label>
                <input className={styles.input} required type="date" value={form.exp_date} onChange={e => setForm(p => ({ ...p, exp_date: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Category</label>
                <input className={styles.input} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Analgesic" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Strength</label>
                <input className={styles.input} value={form.strength} onChange={e => setForm(p => ({ ...p, strength: e.target.value }))} placeholder="e.g. 500mg" />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Dosage Instructions</label>
              <input className={styles.input} value={form.dosage} onChange={e => setForm(p => ({ ...p, dosage: e.target.value }))} placeholder="e.g. Take 1 tablet every 8 hours after food" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Side Effects (comma-separated)</label>
              <input className={styles.input} value={form.side_effects} onChange={e => setForm(p => ({ ...p, side_effects: e.target.value }))} placeholder="e.g. Nausea, Dizziness" />
            </div>

            {qrError && <p className={styles.errorText}>{qrError}</p>}

            <button type="submit" className={styles.generateBtn} disabled={generating}>
              {generating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><QrCode size={16} /> Generate & Sign QR</>}
            </button>
          </form>

          {/* QR Result */}
          {qrResult && (
            <div className={styles.qrResult}>
              <img src={qrResult.qrDataUrl} alt="Generated QR Code" className={styles.qrImg} />
              <div className={styles.qrMeta}>
                <p className={styles.qrMetaItem}><strong>Batch:</strong> {qrResult.batch_id}</p>
                <p className={styles.qrMetaItem}><strong>Serial:</strong> {qrResult.serial_number}</p>
                <p className={styles.qrMetaItem}><strong>Crypto Mode:</strong> <span style={{ color: 'var(--color-brand-primary)', fontWeight: 600 }}>{qrResult.cryptoMode}</span></p>
              </div>
              <button className={styles.downloadBtn} onClick={downloadQR}>
                <Download size={16} /> Download QR
              </button>
            </div>
          )}
        </div>

        {/* Global Scan Map */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}><MapPin size={18} /> Global Scan Locations</h2>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{stats?.scanLocations?.length ?? 0} scan points</span>
          </div>
          <GeoMap
            locations={stats?.scanLocations?.length > 0 ? stats.scanLocations : [{ lat: 20.5937, lng: 78.9629, city: 'India', verdict: 'verified' }]}
            height={340}
          />
          {/* Map Legend */}
          <div className={styles.mapLegend}>
            <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#183D61' }} /> Verified</span>
            <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#B45309' }} /> Suspicious</span>
            <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#B91C1C' }} /> Counterfeit</span>
          </div>
          {/* Recalled Batches */}
          {stats?.recalledBatches?.length > 0 && (
            <div className={styles.recallSection}>
              <p className={styles.recallTitle}><ShieldOff size={16} /> Active Recalls</p>
              {stats.recalledBatches.map((b, i) => (
                <div key={i} className={styles.recallItem}>
                  <XCircle size={14} style={{ color: 'var(--color-danger)' }} />
                  <span>{b.name} — {b.batch_id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}><List size={18} /> Batch Scan Log</h2>
        </div>
        {loading ? (
          <p style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Loading scans...</p>
        ) : !stats?.recentScans?.length ? (
          <p style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No scans recorded for your medicines yet.</p>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Location</th>
                  <th>Score</th>
                  <th>Verdict</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentScans.map((s, i) => (
                  <tr key={i}>
                    <td>{s.batchId || '—'}</td>
                    <td>{s.city || '—'}</td>
                    <td>{s.score ?? '—'}</td>
                    <td><span className={`status-badge badge-${s.verdict}`}>{s.verdict}</span></td>
                    <td>{new Date(s.scannedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
