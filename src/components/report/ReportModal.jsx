'use client';
import { useState } from 'react';
import { X, Phone, ShieldAlert, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

const STEPS = { FORM: 'form', OTP: 'otp', SUCCESS: 'success' };

export default function ReportModal({ onClose, reportData }) {
  const [step, setStep]             = useState(STEPS.FORM);
  const [phone, setPhone]           = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [otp, setOtp]               = useState('');
  const [normalisedPhone, setNormalisedPhone] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [reportId, setReportId]     = useState('');

  const sendOTP = async () => {
    if (!phone.trim() || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/report/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNormalisedPhone(data.phone);
      setStep(STEPS.OTP);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/report/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalisedPhone,
          otp,
          reportData: { ...reportData, pharmacy_name: pharmacyName },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReportId(data.reportId);
      setStep(STEPS.SUCCESS);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: '16px',
        width: '100%', maxWidth: '480px', padding: '2rem',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
        border: '1px solid var(--border-color)',
        position: 'relative',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position:'absolute', top:'1rem', right:'1rem',
          background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)',
        }}>
          <X size={20} />
        </button>

        {/* Step: FORM */}
        {step === STEPS.FORM && (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'1.5rem' }}>
              <div style={{ background:'rgba(220,38,38,0.1)', borderRadius:'10px', padding:'10px' }}>
                <ShieldAlert size={24} style={{ color:'#DC2626' }} />
              </div>
              <div>
                <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--text-primary)', margin:0 }}>
                  Report Counterfeit Medicine
                </h2>
                <p style={{ color:'var(--text-secondary)', margin:0, fontSize:'0.875rem' }}>
                  Your identity is verified via OTP and kept anonymous
                </p>
              </div>
            </div>

            <div style={{ background:'rgba(220,38,38,0.05)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:'8px', padding:'12px', marginBottom:'1.5rem' }}>
              <p style={{ color:'#DC2626', fontSize:'0.875rem', margin:0, fontWeight:600 }}>
                Reporting: {reportData?.batch_id} — Trust Score {reportData?.trust_score}/100
              </p>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)', marginBottom:'6px' }}>
                  Your Phone Number
                </label>
                <div style={{ display:'flex', gap:'8px' }}>
                  <span style={{ padding:'10px 12px', background:'var(--bg-primary)', border:'1px solid var(--border-color)', borderRadius:'8px', color:'var(--text-secondary)', fontSize:'0.9rem' }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    maxLength={10}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g,''))}
                    style={{ flex:1, padding:'10px 12px', background:'var(--bg-primary)', border:'1px solid var(--border-color)', borderRadius:'8px', color:'var(--text-primary)', fontSize:'0.9rem', outline:'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display:'block', fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)', marginBottom:'6px' }}>
                  Pharmacy Name <span style={{ color:'var(--text-muted)', fontWeight:400 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sharma Medical Store, Mumbai"
                  value={pharmacyName}
                  onChange={e => setPharmacyName(e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', background:'var(--bg-primary)', border:'1px solid var(--border-color)', borderRadius:'8px', color:'var(--text-primary)', fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }}
                />
              </div>

              {error && (
                <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'#DC2626', fontSize:'0.875rem' }}>
                  <AlertTriangle size={16} /> {error}
                </div>
              )}

              <button onClick={sendOTP} disabled={loading} style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                padding:'12px', borderRadius:'8px', border:'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: '#DC2626', color:'white', fontWeight:700, fontSize:'1rem',
              }}>
                {loading ? <><Loader2 size={18} style={{ animation:'spin 1s linear infinite' }} /> Sending OTP...</> : <><Phone size={18} /> Send OTP to verify</>}
              </button>
            </div>
          </>
        )}

        {/* Step: OTP */}
        {step === STEPS.OTP && (
          <>
            <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'0.5rem', color:'var(--text-primary)' }}>Enter OTP</h2>
            <p style={{ color:'var(--text-secondary)', marginBottom:'1.5rem', fontSize:'0.9rem' }}>
              A 6-digit OTP was sent to <strong>+91****{phone.slice(-4)}</strong>. Valid for 5 minutes.
            </p>

            <input
              type="text"
              placeholder="_ _ _ _ _ _"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g,''))}
              style={{ width:'100%', padding:'14px', textAlign:'center', fontSize:'1.5rem', letterSpacing:'12px', background:'var(--bg-primary)', border:'1px solid var(--border-color)', borderRadius:'8px', color:'var(--text-primary)', outline:'none', boxSizing:'border-box', marginBottom:'1rem' }}
            />

            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'#DC2626', fontSize:'0.875rem', marginBottom:'1rem' }}>
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={() => { setStep(STEPS.FORM); setError(''); }} style={{
                flex:1, padding:'12px', borderRadius:'8px', border:'1px solid var(--border-color)',
                background:'transparent', color:'var(--text-secondary)', cursor:'pointer', fontWeight:600,
              }}>
                Back
              </button>
              <button onClick={submitReport} disabled={loading} style={{
                flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                padding:'12px', borderRadius:'8px', border:'none', cursor: loading ? 'not-allowed':'pointer',
                background:'#DC2626', color:'white', fontWeight:700,
              }}>
                {loading ? <><Loader2 size={18} style={{ animation:'spin 1s linear infinite' }} /> Submitting...</> : 'Submit Report'}
              </button>
            </div>
          </>
        )}

        {/* Step: SUCCESS */}
        {step === STEPS.SUCCESS && (
          <div style={{ textAlign:'center', padding:'1rem 0' }}>
            <div style={{ background:'rgba(16,185,129,0.1)', borderRadius:'50%', width:'80px', height:'80px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem' }}>
              <CheckCircle2 size={40} style={{ color:'#10b981' }} />
            </div>
            <h2 style={{ fontSize:'1.4rem', fontWeight:700, color:'var(--text-primary)', marginBottom:'0.5rem' }}>
              Report Submitted!
            </h2>
            <p style={{ color:'var(--text-secondary)', marginBottom:'0.5rem' }}>
              Health authorities have been notified. The pharmacy's trust score has been reduced.
            </p>
            <p style={{ color:'var(--text-muted)', fontSize:'0.8rem', marginBottom:'2rem' }}>
              Report ID: <code style={{ background:'var(--bg-primary)', padding:'2px 6px', borderRadius:'4px' }}>{String(reportId).slice(-8).toUpperCase()}</code>
            </p>
            <button onClick={onClose} style={{
              padding:'12px 32px', borderRadius:'8px', border:'none',
              background:'var(--accent-primary)', color:'white', fontWeight:700, cursor:'pointer',
            }}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
