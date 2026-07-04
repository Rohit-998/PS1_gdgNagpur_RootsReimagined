'use client';

import { useState, useRef, useCallback, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldAlert, Flag, CheckCircle2, ArrowLeft, Loader2, MapPin, User, FileText, Mic, MessageSquare, AudioLines, StopCircle, Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, REPORT_PROMPTS } from '@/utils/languages';
import styles from './page.module.css';

function createRecognition(langCode) {
  if (typeof window === 'undefined') return null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.continuous = true;
  r.interimResults = true;
  r.lang = langCode;
  return r;
}

function ReportPageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const batchId = params.get('batch_id') || '';
  const verdict = params.get('verdict') || '';
  const trustScore = params.get('trust_score') || '';

  const [form, setForm] = useState({ reporter_name: '', pharmacy_name: '', location: '', additional_notes: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState('');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [error, setError] = useState('');

  const [activeMode, setActiveMode] = useState('form');
  const [voiceState, setVoiceState] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [selectedLang, setSelectedLang] = useState('hi-IN');

  const cancelledRef = useRef(false);
  const collectedRef = useRef({ pharmacy_name: '', additional_notes: '' });
  const activeAudioRef = useRef(null);
  const activeRecogRef = useRef(null);
  const genRef = useRef(0);

  const playVoice = useCallback(async (text) => {
    const gen = ++genRef.current;
    if (cancelledRef.current) return;
    setVoiceState('speaking');

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = '';
      activeAudioRef.current = null;
    }

    try {
      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: selectedLang })
      });
      if (gen !== genRef.current || cancelledRef.current) return;
      const data = await res.json();
      if (gen !== genRef.current || cancelledRef.current) return;

      if (!data.audioBase64) { await delay(1500); return; }

      await new Promise((resolve) => {
        const audio = new Audio("data:audio/wav;base64," + data.audioBase64);
        activeAudioRef.current = audio;
        const done = () => { activeAudioRef.current = null; resolve(); };
        audio.onended = done;
        audio.onerror = done;
        audio.play().catch(() => { setTimeout(done, 500); });
      });
    } catch {
      await delay(1500);
    }
  }, [selectedLang]);

  const listenForInput = useCallback(async () => {
    if (cancelledRef.current) return '';

    const recognition = createRecognition(selectedLang);
    if (!recognition) return '';
    activeRecogRef.current = recognition;

    setVoiceState('listening');
    setTranscript('');

    return new Promise((resolve) => {
      let fullText = '';
      let resolved = false;
      let silenceTimer = null;

      const finish = (val) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(silenceTimer);
        clearTimeout(maxTimer);
        activeRecogRef.current = null;
        try { recognition.stop(); } catch {}
        resolve(val);
      };

      const maxTimer = setTimeout(() => finish(fullText), 12000);

      const resetSilenceTimer = () => {
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          try { recognition.stop(); } catch {}
        }, 3000);
      };

      recognition.onresult = (event) => {
        let finalText = '';
        let interimText = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }
        fullText = finalText + interimText;
        setTranscript(fullText);
        resetSilenceTimer();
      };

      recognition.onerror = () => {};
      recognition.onend = () => { setTimeout(() => finish(fullText), 200); };

      silenceTimer = setTimeout(() => {
        try { recognition.stop(); } catch {}
      }, 5000);

      try { recognition.start(); }
      catch { finish(''); }
    });
  }, [selectedLang]);

  const stopAssistant = useCallback(() => {
    cancelledRef.current = true;
    genRef.current++;
    if (activeAudioRef.current) { activeAudioRef.current.pause(); activeAudioRef.current.src = ''; activeAudioRef.current = null; }
    if (activeRecogRef.current) { try { activeRecogRef.current.abort(); } catch {} activeRecogRef.current = null; }
    setVoiceState('idle');
    setTranscript('');
  }, []);

  const submitVoiceReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/report/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: batchId || 'VOICE_REPORT',
          verdict: verdict || 'suspicious',
          trust_score: Number(trustScore) || 0,
          pharmacy_name: collectedRef.current.pharmacy_name || 'Voice Reported Pharmacy',
          location: 'Voice Report',
          reporter_name: 'Voice Reporter',
          additional_notes: collectedRef.current.additional_notes || 'Reported via voice',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReportId(data.reportId);
      setSubmitted(true);
    } catch (err) { setError(err.message || 'Failed to submit'); }
    finally { setLoading(false); }
  }, [batchId, verdict, trustScore]);

  const startVoiceAssistant = useCallback(async () => {
    cancelledRef.current = false;
    collectedRef.current = { pharmacy_name: '', additional_notes: '' };
    setChatLog([]);
    setError('');

    const prompts = REPORT_PROMPTS[selectedLang] || REPORT_PROMPTS['default'];

    try { new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA").play().catch(() => {}); } catch {}

    setChatLog(l => [...l, { role: 'ai', text: prompts.welcome }]);
    await playVoice(prompts.welcome);
    if (cancelledRef.current) return;

    let pharmacy = await listenForInput();
    if (cancelledRef.current) return;

    if (!pharmacy.trim()) {
      setChatLog(l => [...l, { role: 'ai', text: prompts.retry }]);
      await playVoice(prompts.retry);
      if (cancelledRef.current) return;
      pharmacy = await listenForInput();
      if (cancelledRef.current) return;
    }
    if (!pharmacy.trim()) pharmacy = 'Unknown Pharmacy';

    collectedRef.current.pharmacy_name = pharmacy;
    setChatLog(l => [...l, { role: 'user', text: pharmacy }]);
    setForm(f => ({ ...f, pharmacy_name: pharmacy }));

    setChatLog(l => [...l, { role: 'ai', text: prompts.issue }]);
    await playVoice(prompts.issue);
    if (cancelledRef.current) return;

    let issue = await listenForInput();
    if (cancelledRef.current) return;

    if (!issue.trim()) {
      setChatLog(l => [...l, { role: 'ai', text: prompts.retry }]);
      await playVoice(prompts.retry);
      if (cancelledRef.current) return;
      issue = await listenForInput();
      if (cancelledRef.current) return;
    }
    if (!issue.trim()) issue = 'Issue reported via voice';

    collectedRef.current.additional_notes = issue;
    setChatLog(l => [...l, { role: 'user', text: issue }]);
    setForm(f => ({ ...f, additional_notes: issue }));

    setChatLog(l => [...l, { role: 'ai', text: prompts.success }]);
    await playVoice(prompts.success);
    if (cancelledRef.current) return;

    setVoiceState('processing');
    await submitVoiceReport();
  }, [playVoice, listenForInput, submitVoiceReport, selectedLang]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.pharmacy_name.trim()) { setError('Please enter the pharmacy name'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/report/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: batchId || 'MANUAL_REPORT',
          verdict, trust_score: Number(trustScore),
          pharmacy_name: form.pharmacy_name,
          location: form.location,
          reporter_name: form.reporter_name,
          additional_notes: form.additional_notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReportId(data.reportId); setSubmitted(true);
    } catch (err) { setError(err.message || 'Failed to submit report'); }
    finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className={styles.successCard}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-verified-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid var(--color-verified-border)' }}>
          <CheckCircle2 size={40} style={{ color: 'var(--color-verified)' }} />
        </div>
        <h1 className={styles.title} style={{ marginBottom: '0.75rem' }}>Report Submitted</h1>
        <p className={styles.subtitle} style={{ marginBottom: '2rem' }}>Thank you for reporting. The pharmacy trust score has been flagged for review.</p>
        <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '16px', margin: '0 auto 2rem', display: 'inline-block' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 4px 0' }}>Report Reference ID</p>
          <p style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>{String(reportId).slice(-10).toUpperCase()}</p>
        </div>
        <div>
          <button onClick={() => router.push('/')} className={styles.homeBtn}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button onClick={() => router.back()} className={styles.backBtn}><ArrowLeft size={16} /> Back</button>

      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <Flag size={32} style={{ color: 'var(--color-danger)' }} />
        </div>
        <div>
          <h1 className={styles.title}>Report Counterfeit</h1>
          <p className={styles.subtitle}>Help protect others. Your report is anonymous.</p>
        </div>
      </div>

      {batchId && (
        <div className={styles.infoPanel}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, margin: '0 0 4px 0', textTransform: 'uppercase' }}>Reporting Medicine</p>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'monospace', fontSize: '1rem', margin: 0 }}>{batchId}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, margin: '0 0 4px 0', textTransform: 'uppercase' }}>Trust Score</p>
            <p style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '1rem', margin: 0 }}>{trustScore}/100</p>
          </div>
        </div>
      )}

      <div className={styles.tabs}>
        <button onClick={() => { setActiveMode('form'); stopAssistant(); }} className={`${styles.tab} ${activeMode === 'form' ? styles.tabActive : ''}`}><FileText size={18} /> Manual Form</button>
        <button onClick={() => setActiveMode('voice')} className={`${styles.tab} ${activeMode === 'voice' ? styles.tabActive : ''}`}><Mic size={18} /> Voice Assistant</button>
      </div>

      {activeMode === 'voice' && voiceState === 'idle' && (
        <div
          ref={langDropdownRef}
          style={{ position: 'relative', marginBottom: '1.5rem', background: 'var(--bg-canvas)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}
        >
          <Globe size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 4px 0', lineHeight: 1 }}>Language</p>
            <button
              type="button"
              onClick={() => setLangDropdownOpen(o => !o)}
              style={{
                width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)',
                textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>{SUPPORTED_LANGUAGES.find(l => l.code === selectedLang)?.name}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, opacity: 0.5, transform: langDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {langDropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
                maxHeight: '220px', overflowY: 'auto', marginTop: '4px'
              }}>
                {SUPPORTED_LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => { setSelectedLang(l.code); setLangDropdownOpen(false); }}
                    style={{
                      display: 'block', width: '100%', padding: '12px 16px', textAlign: 'left',
                      background: l.code === selectedLang ? 'var(--bg-inset)' : 'none',
                      border: 'none', cursor: 'pointer',
                      fontSize: '0.88rem', fontWeight: l.code === selectedLang ? 600 : 400,
                      color: 'var(--text-primary)',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-inset)'}
                    onMouseOut={e => e.currentTarget.style.background = l.code === selectedLang ? 'var(--bg-inset)' : 'none'}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeMode === 'form' ? (
        <div>
          <div className={styles.formGroup}>
            <label className={styles.label}><User size={16} /> Your Name <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>(optional)</span></label>
            <input placeholder="e.g. Rahul Sharma" value={form.reporter_name} onChange={set('reporter_name')} className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}><ShieldAlert size={16} /> Pharmacy Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input placeholder="e.g. Sharma Medical Store" value={form.pharmacy_name} onChange={set('pharmacy_name')} className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}><MapPin size={16} /> Location / Address</label>
            <input placeholder="e.g. Dharavi, Mumbai" value={form.location} onChange={set('location')} className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}><FileText size={16} /> Additional Notes</label>
            <textarea placeholder="Describe what you noticed..." value={form.additional_notes} onChange={set('additional_notes')} rows={4} className={styles.input} style={{ resize: 'vertical', minHeight: '100px' }} />
          </div>
          {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.88rem', fontWeight: 500, margin: '0 0 16px 0', padding: '12px', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-danger-border)' }}>{error}</p>}
          <button onClick={handleSubmit} disabled={loading} className={styles.submitBtn}>
            {loading ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : <><Flag size={18} /> Submit Report</>}
          </button>
        </div>
      ) : (
        <div className={styles.voicePanel}>
          <div className={styles.voiceIcon} style={{ background: voiceState === 'listening' ? 'var(--color-danger-bg)' : voiceState === 'speaking' ? 'var(--color-brand-primary-tint)' : 'var(--bg-canvas)' }}>
            {voiceState === 'listening' ? <Mic size={32} color="var(--color-danger)" /> : <AudioLines size={32} color={voiceState === 'speaking' ? 'var(--color-brand-primary)' : 'var(--text-muted)'} />}
          </div>

          <h2 className={styles.voiceTitle}>
            {voiceState === 'idle' ? 'Voice Assistant' : voiceState === 'speaking' ? 'AI is speaking...' : voiceState === 'listening' ? 'Listening...' : 'Processing...'}
          </h2>

          <div className={styles.chatLog}>
            {chatLog.length === 0 && voiceState === 'idle' && <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.88rem', textAlign: 'center', fontWeight: 500 }}>Press start and the AI will guide you through the reporting process.</p>}
            {chatLog.map((msg, i) => (
               <div key={i} style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: msg.role === 'ai' ? 'var(--text-primary)' : 'var(--color-verified)' }}>{msg.role === 'ai' ? 'AI Assistant' : 'You'}:</span>
                <p style={{ margin: '4px 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{msg.text}</p>
              </div>
            ))}
            {voiceState === 'listening' && (
              <div style={{ marginBottom: '16px', background: 'var(--bg-inset)', padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-verified)' }}>You:</span>
                <p style={{ margin: '4px 0 0', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>{transcript || '...'}</p>
              </div>
            )}
          </div>

          {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.88rem', fontWeight: 500, margin: '0 0 16px 0', padding: '12px', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-danger-border)' }}>{error}</p>}

          {voiceState === 'idle' ? (
            <button onClick={startVoiceAssistant} className={styles.startVoiceBtn}>
              <MessageSquare size={18} /> Start Voice Assistant
            </button>
          ) : (
            <button onClick={stopAssistant} className={styles.cancelBtn}>
              <StopCircle size={18} /> Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

export default function ReportPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '4rem' }}><Loader2 size={28} className="animate-spin" style={{ margin: '0 auto' }} color="var(--color-brand-primary)" /></div>}>
      <ReportPageContent />
    </Suspense>
  );
}
