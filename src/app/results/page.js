'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ShieldCheck, ShieldAlert, ShieldX, Calendar, Hash,
  Building2, Package, Volume2, VolumeX,
  ArrowLeft, Loader2, Flag, Pill, AlertCircle, MapPin
} from 'lucide-react';
import dynamic from 'next/dynamic';
import StatusBadge from '@/components/ui/StatusBadge';
import styles from './page.module.css';
import { SUPPORTED_LANGUAGES, buildVerdictAudioText } from '@/utils/languages';

const GeoMap = dynamic(() => import('@/components/GeoMap'), { ssr: false });

const LAYER_META = {
  batchCheck:    { name: 'Batch Validation',      max: 30 },
  hashCheck:     { name: 'Cryptographic Hash',    max: 25 },
  scanFrequency: { name: 'Clone Detection',       max: 20 },
  geoCheck:      { name: 'Geographic Validation', max: 10 },
  temporalCheck: { name: 'Temporal Validation',   max: 10 },
  supplyChain:   { name: 'Supply Chain Integrity',max: 5  },
};

const VERDICT_CONFIG = {
  verified:    { color: 'var(--color-verified)',   bg: 'var(--color-verified-bg)',   border: 'var(--color-verified-border)',   Icon: ShieldCheck, title: 'Authenticity Verified', sub: 'Passed all security layers. Safe to consume.' },
  suspicious:  { color: 'var(--color-suspicious)', bg: 'var(--color-suspicious-bg)', border: 'var(--color-suspicious-border)', Icon: ShieldAlert, title: 'Suspicious - Do Not Use', sub: 'Some verification layers failed. Do not consume.' },
  counterfeit: { color: 'var(--color-danger)',     bg: 'var(--color-danger-bg)',     border: 'var(--color-danger-border)',     Icon: ShieldX,     title: 'Counterfeit Detected',  sub: 'Multiple failures. This medicine is likely fake.' },
};

const grades = ['A+', 'A', 'B', 'C', 'D', 'F'];
const gradeFromScore = s => s >= 90 ? 'A+' : s >= 80 ? 'A' : s >= 65 ? 'B' : s >= 50 ? 'C' : s >= 40 ? 'D' : 'F';

function ResultsPageContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const audioEl = useRef(null);

  const [result, setResult]         = useState(null);
  const [lang, setLang]             = useState('hi-IN');
  const [audioState, setAudioState] = useState('idle');
  const [audioSrc, setAudioSrc]     = useState(null);

  useEffect(() => {
    const raw = params.get('data');
    if (!raw) return;
    try { setResult(JSON.parse(decodeURIComponent(raw))); } catch {}
    const bl = navigator.language || 'hi-IN';
    const auto = ['ta','te','mr','bn','gu','kn','ml','pa','or'].find(l => bl.startsWith(l));
    if (auto) setLang(`${auto}-IN`);
  }, [params]);

  useEffect(() => {
    if (!result?.verdict) return;
    fetchAndPrepareAudio(result.verdict, lang);
  }, [result, lang]);

  const fetchAndPrepareAudio = async (verdict, langCode) => {
    setAudioState('loading');

    if (audioEl.current) {
      audioEl.current.pause();
      audioEl.current.src = '';
      audioEl.current.removeAttribute('src');
      audioEl.current.load();
      audioEl.current = null;
    }
    setAudioSrc(null);

    const text = buildVerdictAudioText(
      verdict, langCode, result?.results || {}, result?.medicineInfo?.name || null
    );

    const requestLang = langCode;

    try {
      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: langCode }),
      });

      if (requestLang !== lang) return;

      const { audioBase64 } = await res.json();
      if (!audioBase64) throw new Error('No audio');

      const src = `data:audio/wav;base64,${audioBase64}`;
      setAudioSrc(src);

      const audio = new Audio(src);
      audioEl.current = audio;

      audio.addEventListener('ended',  () => setAudioState('ready'));
      audio.addEventListener('pause',  () => setAudioState('ready'));
      audio.addEventListener('error',  () => setAudioState('error'));

      audio.addEventListener('canplaythrough', () => {
        if (audioEl.current !== audio) return;
        setAudioState('ready');
        audio.play().then(() => setAudioState('playing')).catch(() => setAudioState('ready'));
      }, { once: true });

      audio.load();
    } catch {
      setAudioState('error');
    }
  };

  const toggleAudio = () => {
    const audio = audioEl.current;
    if (!audio) return;
    if (audioState === 'playing') {
      audio.pause();
    } else {
      audio.currentTime = 0;
      audio.play().then(() => setAudioState('playing')).catch(() => {});
    }
  };

  const handleLangChange = (e) => {
    setLang(e.target.value);
  };

  if (!result) return (
    <div className={`container ${styles.resultsContainer}`} style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <ShieldAlert size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
      <h2 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>No verification data found.</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Scan a medicine QR code first.</p>
      <button onClick={() => router.push('/scan')}
        style={{ padding: '12px 24px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-brand-primary)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', minHeight: '48px' }}>
        Go to Scanner
      </button>
    </div>
  );

  const { medicineInfo, results, totalScore, verdict } = result;
  const vc    = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.suspicious;
  const VIcon = vc.Icon;
  const grade = gradeFromScore(totalScore);

  return (
    <div className={`container ${styles.resultsContainer}`}>
      <div className={styles.header}>
        <button onClick={() => router.push('/scan')} className={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Scanner
        </button>

        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Verification Results</h1>
            <p className={styles.subtitle}>Analysis complete. Trust score generated.</p>
          </div>

          <div className={styles.audioControls}>
            <select value={lang} onChange={handleLangChange} className={styles.langSelect} aria-label="Select language for audio verdict">
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>

            <button
              onClick={toggleAudio}
              disabled={audioState === 'loading' || audioState === 'idle' || audioState === 'error'}
              className={styles.audioBtn}
              style={{
                background: audioState === 'playing' ? vc.color : 'var(--bg-surface)',
                color: audioState === 'playing' ? '#FFFFFF' : vc.color,
                borderColor: vc.color,
              }}
            >
              {audioState === 'loading' && <><Loader2 size={16} className="animate-spin" /> Loading audio...</>}
              {audioState === 'ready'   && <><Volume2 size={16} /> Play Verdict</>}
              {audioState === 'playing' && <><Volume2 size={16} /> Playing...</>}
              {audioState === 'error'   && <><VolumeX size={16} /> Audio Error</>}
              {audioState === 'idle'    && <><VolumeX size={16} /> Loading...</>}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.scoreSection}>
        <div className={styles.scoreCard}>
          <div>
            <p className={styles.scoreLabel}>Authenticity Score</p>
            <h2 className={styles.scoreValue} style={{ color: vc.color }}>
              {totalScore}<span className={styles.scoreMax}>/100</span>
            </h2>
          </div>
          <div>
            <div className={styles.gradeScale}>
              {grades.map(g => (
                <span key={g} className={`${styles.grade} ${g === grade ? styles.gradeActive : ''}`}
                  style={g === grade ? { backgroundColor: vc.color, color: 'white' } : {}}>
                  {g}
                </span>
              ))}
            </div>
            <p className={styles.gradeDesc}>{verdict === 'verified' ? 'Highest Trust Tier' : verdict === 'suspicious' ? 'Low Trust' : 'Failed Verification'}</p>
          </div>
        </div>

        <div className={styles.infoCard}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <Package size={16} className={styles.infoIcon} />
              <div>
                <p className={styles.infoLabel}>Medicine Name</p>
                <p className={styles.infoValue}>{medicineInfo?.name || 'Unknown'}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <Building2 size={16} className={styles.infoIcon} />
              <div>
                <p className={styles.infoLabel}>Manufacturer</p>
                <p className={styles.infoValue}>{medicineInfo?.manufacturer || 'Not Found'}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <Hash size={16} className={styles.infoIcon} />
              <div>
                <p className={styles.infoLabel}>Batch ID</p>
                <p className={styles.infoValue}>{medicineInfo?.batch_id || '-'}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <Calendar size={16} className={styles.infoIcon} />
              <div>
                <p className={styles.infoLabel}>Expiry Date</p>
                <p className={styles.infoValue}>{medicineInfo?.exp_date ? new Date(medicineInfo.exp_date).toLocaleDateString() : '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.verdictBanner} style={{ background: vc.bg, border: `1px solid ${vc.border}`, color: vc.color }}>
        <VIcon size={32} />
        <div style={{ flex: 1 }}>
          <h2 className={styles.verdictTitle}>{vc.title}</h2>
          <p style={{ opacity: 0.9, fontSize: 'var(--text-sm)', margin: 0 }}>{vc.sub}</p>
        </div>
        {verdict !== 'verified' && (
          <button
            onClick={() => router.push(`/report?batch_id=${encodeURIComponent(medicineInfo?.batch_id || '')}&verdict=${verdict}&trust_score=${totalScore}`)}
            className={styles.reportBtn}
            style={{ borderColor: vc.color, color: vc.color }}
          >
            <Flag size={14} /> Report This
          </button>
        )}
      </div>

      {medicineInfo && (medicineInfo.category || medicineInfo.instructions || medicineInfo.side_effects?.length > 0) && (
        <div className={styles.drugInfoCard}>
          <div className={styles.drugInfoHeader}>
            <Pill size={18} />
            <h3>Drug Information</h3>
          </div>

          <div className={styles.drugInfoGrid}>
            <div>
              <p className={styles.drugInfoSectionTitle}><AlertCircle size={14} /> Usage and Dosage</p>
              <p className={styles.drugInfoText}>
                <span className={styles.drugInfoStrong}>Category:</span> {medicineInfo.category || 'N/A'} {medicineInfo.strength ? `(${medicineInfo.strength})` : ''}
              </p>
              <p className={styles.drugInfoText}>
                <span className={styles.drugInfoStrong}>Dosage:</span> {medicineInfo.dosage || 'Consult your doctor.'}
              </p>
              {medicineInfo.instructions && (
                <p className={styles.drugInfoText}>
                  <span className={styles.drugInfoStrong}>Instructions:</span> {medicineInfo.instructions}
                </p>
              )}
            </div>

            {medicineInfo.side_effects?.length > 0 && (
              <div>
                <p className={styles.drugInfoSectionTitle}><AlertCircle size={14} /> Warnings and Side Effects</p>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>Common Side Effects:</p>
                <div className={styles.sideEffectList}>
                  {medicineInfo.side_effects.map(effect => (
                    <span key={effect} className={styles.sideEffectTag}>{effect}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <h3 className={styles.sectionTitle}>Security Layer Analysis</h3>
        <div className={styles.layerGrid}>
          {Object.entries(LAYER_META).map(([key, meta]) => {
            const layer  = results?.[key];
            const passed = layer?.passed;
            return (
              <div key={key} className={styles.layerCard}>
                <div className={styles.layerHeader}>
                  <h4 className={styles.layerName}>{meta.name}</h4>
                  <StatusBadge status={passed ? 'verified' : 'counterfeit'} label={passed ? 'PASSED' : 'FAILED'} />
                </div>
                <p className={styles.layerDesc}>
                  {layer?.message || '-'}
                  {key === 'scanFrequency' && layer?.scanCount != null && (
                    <span className={styles.scanCount} style={{ color: passed ? 'var(--color-verified)' : 'var(--color-danger)' }}>
                      Scan Count: {layer.scanCount}
                    </span>
                  )}
                </p>
                <div className={styles.layerScore} style={{ color: passed ? 'var(--color-verified)' : 'var(--color-danger)' }}>
                  {layer?.score ?? 0} / {meta.max} pts
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {results?.supplyChain?.events && results.supplyChain.events.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <h3 className={styles.sectionTitle}>Supply Chain Timeline</h3>
          <div className={styles.timelineCard}>
            <div className={styles.timeline}>
              {results.supplyChain.events.map((event, index, arr) => (
                <div key={index} className={styles.timelineNode}>
                  <div className={styles.timelineIcon}>
                    {index === 0 ? <Building2 size={16} /> : index === arr.length - 1 ? <Package size={16} /> : <Hash size={16} />}
                  </div>
                  {index < arr.length - 1 && <div className={styles.connector} />}
                  <p className={styles.nodeName}>{event.location || event.type}</p>
                  <p className={styles.nodeDate}>{new Date(event.timestamp).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {result?.userLocation && result.userLocation.lat && (
        <div style={{ marginTop: '1rem' }}>
          <h3 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} />
            Geographic Validation
          </h3>
          <div className={styles.geoCard}>
            <div className={styles.geoHeader}>
              <span className={styles.geoTitle}>Scan Location</span>
              <span className={`status-badge badge-${verdict}`}>
                {result.userLocation.region || 'Located'}
              </span>
            </div>
            <GeoMap
              lat={result.userLocation.lat}
              lng={result.userLocation.lng}
              city={result.userLocation.region || 'your location'}
              verifying={false}
              resultVerdict={verdict}
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '4rem' }}><Loader2 size={28} className="animate-spin" style={{ margin: '0 auto' }} color="var(--color-brand-primary)" /></div>}>
      <ResultsPageContent />
    </Suspense>
  );
}
