'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertTriangle, Flag, TrendingUp, Activity, Users, BarChart3, Clock, ChevronRight, RefreshCw } from 'lucide-react';

function AnimCount({ target, dur = 1200 }) {
  const [c, setC] = useState(0);
  useEffect(() => {
    if (!target) return;
    const step = target / (dur / 16);
    let cur = 0;
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setC(target); clearInterval(t); }
      else setC(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [target, dur]);
  return <>{c.toLocaleString()}</>;
}

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('mg_user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'regulator' && user.role !== 'manufacturer') {
        router.push('/');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, reportsRes, pharmaciesRes] = await Promise.all([
        fetch('/api/stats').then(r => r.json()),
        fetch('/api/report', { method: 'GET' }).then(r => r.json()).catch(() => ({ reports: [] })),
        fetch('/api/pharmacies').then(r => r.json()).catch(() => ({ pharmacies: [] })),
      ]);
      setStats(statsRes);
      setReports(reportsRes.reports || []);
      setPharmacies(pharmaciesRes.pharmacies || pharmaciesRes || []);
    } catch {}
    setLoading(false);
  };

  // useEffect(() => { fetchData(); }, []);

  const verdictColor = v => v === 'verified' ? 'var(--color-verified)' : v === 'suspicious' ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={24} style={{ color: 'var(--accent-primary)' }} />
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>Real-time overview of SafeDose operations</p>
        </div>
        <button onClick={fetchData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-sans)' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Scans', value: stats?.totalScans ?? 0, color: 'var(--accent-primary)', icon: ShieldCheck },
          { label: 'Counterfeits Detected', value: stats?.totalCounterfeits ?? 0, color: 'var(--color-danger)', icon: AlertTriangle },
          { label: 'Reports Filed', value: reports.length, color: 'var(--color-warning)', icon: Flag },
          { label: 'Pharmacies Flagged', value: stats?.pharmaciesFlagged ?? 0, color: '#7C3AED', icon: Activity },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', borderLeft: `4px solid ${color}`, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, margin: 0 }}>{label}</p>
              <Icon size={16} style={{ color }} />
            </div>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, color, margin: 0 }}>
              {stats || reports.length ? <AnimCount target={value} /> : '-'}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', gridColumn: reports.length === 0 ? '1 / -1' : undefined, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <Flag size={16} style={{ color: 'var(--color-warning)' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Recent Reports</h2>
          </div>
          {reports.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>No reports filed yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
              {reports.slice(0, 10).map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: verdictColor(r.verdict), flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.pharmacy_name || 'Anonymous'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {r.batch_id} | {r.status || 'pending'}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: verdictColor(r.verdict), color: 'white' }}>
                    {r.verdict || 'suspicious'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <Users size={16} style={{ color: '#7C3AED' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Flagged Pharmacies</h2>
          </div>
          {pharmacies.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>No pharmacies flagged yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
              {pharmacies.filter(p => (p.trust_score || 100) < 80).slice(0, 10).map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={16} style={{ color: 'var(--color-danger)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.location || 'Unknown location'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: (p.trust_score || 100) < 50 ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                      {p.trust_score ?? 100}/100
                    </p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Trust Score</p>
                  </div>
                </div>
              ))}
              {pharmacies.filter(p => (p.trust_score || 100) < 80).length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>All pharmacies are in good standing.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} style={{ color: 'var(--color-verified)' }} /> System Status
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { name: 'Verification Engine', status: 'Operational', color: 'var(--color-verified)' },
            { name: 'Sarvam AI TTS', status: 'Operational', color: 'var(--color-verified)' },
            { name: 'MongoDB Atlas', status: 'Connected', color: 'var(--color-verified)' },
            { name: 'Voice Agent', status: '10 Languages', color: 'var(--accent-primary)' },
          ].map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: s.color, fontWeight: 600 }}>{s.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
