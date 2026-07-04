'use client';
import { useState } from 'react';

// Pre-filled demo data (hashes from seed output)
const DEMO_QR = {
  genuine: { batch_id: 'BATCH-SUN-2024-001', serial_number: 'SN-0001', hash: 'd715e9387d6bce864f35052850648a4f3bc25f619113f49c1986eccccbdb05d9' },
  cloned: { batch_id: 'BATCH-CIP-2024-015', serial_number: 'SN-0002', hash: 'b40419acf79cc146a7baa0a136fb31471a1e53e25f24d84cc37428520ba55ac0' },
  diverted: { batch_id: 'BATCH-NOV-2024-003', serial_number: 'SN-0003', hash: '594d7c69401d6856b2e626d33c7ea04b5a04f17806ea5166980306601eb1ea10' },
  expired: { batch_id: 'BATCH-CIP-2023-012', serial_number: 'SN-0004', hash: '673ce86ed43eeb3d6dae5b15be4a2c038d83879db1e7423fffbaa6b8182d3c69' },
  fake: { batch_id: 'BATCH-FAKE-9999', serial_number: 'SN-FAKE', hash: 'fakehash123' },
};

const DEMO_LOCATION = { lat: 19.076, lng: 72.8777, city: 'Mumbai', region: 'Maharashtra' };

function Section({ title, children, color = 'blue' }) {
  const borderColors = { blue: 'border-blue-500', green: 'border-emerald-500', red: 'border-red-500', yellow: 'border-amber-500', purple: 'border-purple-500', cyan: 'border-cyan-500' };
  return (
    <div className={`glass-panel p-5 border-l-4 ${borderColors[color] || borderColors.blue}`}>
      <h2 className="text-lg font-bold mb-4 text-white">{title}</h2>
      {children}
    </div>
  );
}

function JsonBlock({ data }) {
  if (!data) return null;
  return (
    <pre className="bg-slate-900 p-3 rounded-lg text-xs overflow-auto max-h-80 text-slate-300 mt-3 border border-slate-700">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function Btn({ onClick, children, variant = 'primary', disabled = false, size = 'md' }) {
  const styles = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    warning: 'bg-amber-600 hover:bg-amber-500 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
  };
  const sizes = { sm: 'px-2 py-1 text-xs', md: 'px-3 py-1.5 text-sm', lg: 'px-4 py-2 text-base' };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${styles[variant]} ${sizes[size]} rounded-md font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed`}>
      {disabled ? '⏳ Loading...' : children}
    </button>
  );
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-slate-400 font-medium">{label}</label>}
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="bg-slate-800 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
    </div>
  );
}

// ─── 1. Verify Medicine ──────────────────────
function VerifyPanel() {
  const [batchId, setBatchId] = useState('BATCH-SUN-2024-001');
  const [serial, setSerial] = useState('SN-0001');
  const [hash, setHash] = useState('');
  const [region, setRegion] = useState('Maharashtra');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrData: { batch_id: batchId, serial_number: serial, hash: hash || 'auto' },
          userLocation: { ...DEMO_LOCATION, region },
        }),
      });
      setResult(await res.json());
    } catch (e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  const loadPreset = (key) => {
    const d = DEMO_QR[key];
    setBatchId(d.batch_id); setSerial(d.serial_number); setHash(d.hash);
  };

  const verdictColor = result?.verdict === 'verified' ? 'text-emerald-400' : result?.verdict === 'suspicious' ? 'text-amber-400' : 'text-red-400';

  return (
    <Section title="🔍 1. Verify Medicine (POST /api/verify)" color="blue">
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.keys(DEMO_QR).map(k => (
          <button key={k} onClick={() => loadPreset(k)}
            className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 capitalize">{k}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Input label="Batch ID" value={batchId} onChange={setBatchId} />
        <Input label="Serial Number" value={serial} onChange={setSerial} />
        <Input label="Hash (leave empty for auto)" value={hash} onChange={setHash} />
        <Input label="Region" value={region} onChange={setRegion} />
      </div>
      <Btn onClick={verify} disabled={loading}>Verify Medicine</Btn>
      {result && (
        <div className="mt-3">
          {result.verdict && (
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-2xl font-bold ${verdictColor}`}>{result.verdict?.toUpperCase()}</span>
              <span className="text-slate-400">Score: <span className="text-white font-bold">{result.totalScore}/100</span></span>
            </div>
          )}
          {result.aiAnalysis && (
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 mb-2">
              <p className="text-xs text-blue-400 font-medium mb-1">🤖 AI Analysis ({result.aiAnalysis.source})</p>
              <p className="text-sm text-slate-300">{result.aiAnalysis.analysis}</p>
              {result.aiAnalysis.riskFactors?.length > 0 && (
                <ul className="mt-2 text-xs text-amber-400">{result.aiAnalysis.riskFactors.map((r, i) => <li key={i}>⚠ {r}</li>)}</ul>
              )}
            </div>
          )}
          <JsonBlock data={result} />
        </div>
      )}
    </Section>
  );
}

// ─── 2. Drug Info ──────────────────────
function DrugInfoPanel() {
  const [batchId, setBatchId] = useState('BATCH-SUN-2024-001');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/medicine/${batchId}`);
      setResult(await res.json());
    } catch (e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  return (
    <Section title="💊 2. Drug Information (GET /api/medicine/:batchId)" color="green">
      <div className="flex gap-2 items-end">
        <Input label="Batch ID" value={batchId} onChange={setBatchId} />
        <Btn onClick={fetch_} disabled={loading} variant="success">Fetch Info</Btn>
      </div>
      <JsonBlock data={result} />
    </Section>
  );
}

// ─── 3. Recall System ──────────────────────
function RecallPanel() {
  const [batchId, setBatchId] = useState('BATCH-CIP-2023-012');
  const [reason, setReason] = useState('Quality control failure detected in lab tests');
  const [result, setResult] = useState(null);
  const [recalls, setRecalls] = useState(null);
  const [loading, setLoading] = useState(false);

  const issueRecall = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId, reason }),
      });
      setResult(await res.json());
    } catch (e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  const listRecalls = async () => {
    const res = await fetch('/api/recall');
    setRecalls(await res.json());
  };

  return (
    <Section title="🚨 3. Batch Recall (POST + GET /api/recall)" color="red">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Input label="Batch ID to Recall" value={batchId} onChange={setBatchId} />
        <Input label="Reason" value={reason} onChange={setReason} />
      </div>
      <div className="flex gap-2">
        <Btn onClick={issueRecall} disabled={loading} variant="danger">Issue Recall</Btn>
        <Btn onClick={listRecalls} variant="secondary">List All Recalls</Btn>
      </div>
      <JsonBlock data={result || recalls} />
    </Section>
  );
}

// ─── 4. Reports ──────────────────────
function ReportPanel() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    const res = await fetch('/api/report');
    setReports(await res.json());
    setLoading(false);
  };

  const createDummyReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationResult: {
            medicineInfo: { name: 'Test Medicine', manufacturer: 'Test Corp', batch_id: 'BATCH-TEST-001' },
            results: { batchCheck: { passed: false, score: 0 } },
            totalScore: 15,
            verdict: 'counterfeit',
          },
          scanLocation: DEMO_LOCATION,
          reported_by: 'demo_tester',
          reporter_role: 'consumer',
        }),
      });
      setReports(await res.json());
    } catch (e) { setReports({ error: e.message }); }
    setLoading(false);
  };

  return (
    <Section title="📋 4. Reports (POST + GET /api/report)" color="yellow">
      <div className="flex gap-2 mb-2">
        <Btn onClick={fetchReports} disabled={loading} variant="warning">List Reports</Btn>
        <Btn onClick={createDummyReport} disabled={loading} variant="secondary">Create Test Report</Btn>
      </div>
      <JsonBlock data={reports} />
    </Section>
  );
}

// ─── 5. Stats ──────────────────────
function StatsPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    const res = await fetch('/api/stats');
    setStats(await res.json());
    setLoading(false);
  };

  return (
    <Section title="📊 5. Analytics (GET /api/stats)" color="purple">
      <Btn onClick={fetchStats} disabled={loading} variant="primary">Load Stats</Btn>
      {stats?.overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {Object.entries(stats.overview).map(([k, v]) => (
            <div key={k} className="bg-slate-800 rounded-lg p-3 text-center border border-slate-700">
              <p className="text-xs text-slate-400">{k.replace(/_/g, ' ')}</p>
              <p className="text-xl font-bold text-white">{v}</p>
            </div>
          ))}
        </div>
      )}
      <JsonBlock data={stats} />
    </Section>
  );
}

// ─── 6. Anomaly Detection ──────────────────────
function AlertsPanel() {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    const res = await fetch('/api/alerts');
    setAlerts(await res.json());
    setLoading(false);
  };

  const sevColor = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-500', low: 'bg-blue-500' };

  return (
    <Section title="🔔 6. Anomaly Alerts (GET /api/alerts)" color="red">
      <Btn onClick={fetchAlerts} disabled={loading} variant="danger">Run Detection</Btn>
      {alerts?.alerts && (
        <div className="mt-3 space-y-2">
          {alerts.alerts.map((a, i) => (
            <div key={i} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded text-white ${sevColor[a.severity]}`}>{a.severity}</span>
                <span className="text-sm font-medium text-white">{a.title}</span>
              </div>
              <p className="text-xs text-slate-400">{a.description}</p>
            </div>
          ))}
          {alerts.alerts.length === 0 && <p className="text-sm text-slate-500">No anomalies detected</p>}
        </div>
      )}
      <JsonBlock data={alerts} />
    </Section>
  );
}

// ─── 7. Manufacturer Portal ──────────────────────
function ManufacturerPanel() {
  const [name, setName] = useState('Sun Pharma');
  const [batches, setBatches] = useState(null);
  const [regResult, setRegResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBatches = async () => {
    setLoading(true);
    const res = await fetch(`/api/manufacturer/batches?name=${encodeURIComponent(name)}`);
    setBatches(await res.json());
    setLoading(false);
  };

  const registerNew = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/manufacturer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manufacturer_name: 'Sun Pharma',
          medicine_name: 'Aspirin 100mg',
          batch_id: `BATCH-TEST-${Date.now()}`,
          serial_number: `SN-TEST-${Math.floor(Math.random() * 9999)}`,
          mfg_date: '2024-06-01',
          exp_date: '2027-06-01',
          authorized_region: 'India-Maharashtra',
          category: 'analgesic',
          strength: '100mg',
          dosage: '1 tablet daily',
          side_effects: ['Stomach upset', 'Bleeding risk'],
        }),
      });
      setRegResult(await res.json());
    } catch (e) { setRegResult({ error: e.message }); }
    setLoading(false);
  };

  return (
    <Section title="🏭 7. Manufacturer Portal (/api/manufacturer)" color="cyan">
      <div className="flex gap-2 items-end mb-3">
        <Input label="Manufacturer Name" value={name} onChange={setName} />
        <Btn onClick={fetchBatches} disabled={loading} variant="primary">List Batches</Btn>
        <Btn onClick={registerNew} disabled={loading} variant="success">Register New Medicine</Btn>
      </div>
      <JsonBlock data={regResult || batches} />
    </Section>
  );
}

// ─── 8. Drug Interactions ──────────────────────
function InteractionsPanel() {
  const [med1, setMed1] = useState('Paracetamol 500mg');
  const [med2, setMed2] = useState('Metformin 500mg');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/interactions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicines: [med1, med2] }),
      });
      setResult(await res.json());
    } catch (e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  const statusColor = { safe: 'text-emerald-400', caution: 'text-amber-400', dangerous: 'text-red-400' };

  return (
    <Section title="💉 8. Drug Interaction Checker (POST /api/interactions/check)" color="yellow">
      <div className="flex gap-2 items-end mb-3">
        <Input label="Medicine 1" value={med1} onChange={setMed1} />
        <Input label="Medicine 2" value={med2} onChange={setMed2} />
        <Btn onClick={check} disabled={loading} variant="warning">Check</Btn>
      </div>
      {result?.safety_status && (
        <p className={`text-lg font-bold ${statusColor[result.safety_status]}`}>
          {result.safety_status === 'safe' ? '✅ Safe' : result.safety_status === 'caution' ? '⚠️ Caution' : '🚨 Dangerous'}
          {' — '}{result.total_interactions} interaction(s) found
        </p>
      )}
      <JsonBlock data={result} />
    </Section>
  );
}

// ─── 9. Auth ──────────────────────
function AuthPanel() {
  const [email, setEmail] = useState('consumer@demo.com');
  const [password, setPassword] = useState('demo123');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      setResult(await res.json());
    } catch (e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  const register = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `test_${Date.now()}@demo.com`, name: 'Test User', password: 'test123', role: 'consumer' }),
      });
      setResult(await res.json());
    } catch (e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  return (
    <Section title="🔐 9. Authentication (/api/auth)" color="purple">
      <div className="flex gap-2 items-end mb-3">
        <Input label="Email" value={email} onChange={setEmail} />
        <Input label="Password" value={password} onChange={setPassword} />
        <Btn onClick={login} disabled={loading}>Login</Btn>
        <Btn onClick={register} disabled={loading} variant="secondary">Register New</Btn>
      </div>
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {['consumer@demo.com', 'pharmacy@demo.com', 'manufacturer@demo.com', 'regulator@demo.com'].map(e => (
          <button key={e} onClick={() => setEmail(e)} className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">{e}</button>
        ))}
      </div>
      <JsonBlock data={result} />
    </Section>
  );
}

// ─── 10. Webhooks ──────────────────────
function WebhookPanel() {
  const [webhooks, setWebhooks] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const listWebhooks = async () => {
    const res = await fetch('/api/webhooks');
    setWebhooks(await res.json());
  };

  const registerWebhook = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://webhook.site/test',
          events: ['counterfeit_detected', 'recall_issued'],
          owner: 'Test Pharmacy',
          owner_role: 'pharmacy',
          region: 'Maharashtra',
        }),
      });
      setResult(await res.json());
    } catch (e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  return (
    <Section title="🔗 10. Webhooks (POST + GET /api/webhooks)" color="cyan">
      <div className="flex gap-2 mb-2">
        <Btn onClick={listWebhooks} variant="primary">List Webhooks</Btn>
        <Btn onClick={registerWebhook} disabled={loading} variant="success">Register Test Webhook</Btn>
      </div>
      <JsonBlock data={result || webhooks} />
    </Section>
  );
}

// ─── 11. Recent Scans ──────────────────────
function RecentScansPanel() {
  const [scans, setScans] = useState(null);

  const fetch_ = async () => {
    const res = await fetch('/api/recent-scans');
    setScans(await res.json());
  };

  return (
    <Section title="📜 Recent Scans (GET /api/recent-scans)" color="green">
      <Btn onClick={fetch_} variant="success">Load Recent Scans</Btn>
      <JsonBlock data={scans} />
    </Section>
  );
}

// ─── Main Page ──────────────────────
export default function TestDashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">🧪 SafeDose API Test Dashboard</h1>
        <p className="text-slate-400 mt-1">Test all 13 backend endpoints. Make sure to run <code className="bg-slate-800 px-2 py-0.5 rounded text-blue-400 text-sm">node seed.mjs</code> first.</p>
      </div>

      <div className="grid gap-5">
        <VerifyPanel />
        <DrugInfoPanel />
        <RecallPanel />
        <ReportPanel />
        <StatsPanel />
        <AlertsPanel />
        <ManufacturerPanel />
        <InteractionsPanel />
        <AuthPanel />
        <WebhookPanel />
        <RecentScansPanel />
      </div>
    </div>
  );
}
