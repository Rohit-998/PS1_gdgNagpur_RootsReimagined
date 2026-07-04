'use client';

import { useState, useEffect, useRef } from 'react';
import { ShieldAlert, ShieldCheck, ShieldX, QrCode, CheckCircle2, XCircle, Volume2, Play, Loader2 } from 'lucide-react';
import styles from './page.module.css';

const FAKE_QR_PAYLOAD = {
  batch_id: 'BATCH-CIP-2024-015',
  serial_number: 'SN-0002',
  hash: ''
};

export default function DemoPage() {
  const [currentStep, setCurrentStep]   = useState(-1);
  const [demoSteps, setDemoSteps]       = useState([]);
  const [done, setDone]                 = useState(false);
  const [running, setRunning]           = useState(false);
  const [verdict, setVerdict]           = useState(null);
  const [score, setScore]               = useState(null);
  const [audioReady, setAudioReady]     = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  async function runDemo() {
    setCurrentStep(-1);
    setDone(false);
    setRunning(true);
    setDemoSteps([]);
    setVerdict(null);
    setScore(null);
    setAudioReady(false);

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrData: FAKE_QR_PAYLOAD,
          userLocation: { region: 'Maharashtra', lat: 19.076, lng: 72.877 }
        }),
      });
      const data = await res.json();

      const layerMap = [
        { label: 'Batch Check',           key: 'batchCheck' },
        { label: 'Hash Verification',     key: 'hashCheck' },
        { label: 'Clone Detection',       key: 'scanFrequency' },
        { label: 'Geo Validation',        key: 'geoCheck' },
        { label: 'Temporal Validation',   key: 'temporalCheck' },
        { label: 'Supply Chain Check',    key: 'supplyChain' },
      ];

      const steps = layerMap.map(l => ({
        label: l.label,
        status: data.results?.[l.key]?.passed ? 'success' : 'fail',
        message: data.results?.[l.key]?.message || '',
      }));

      setDemoSteps(steps);
      setVerdict(data.verdict);
      setScore(data.totalScore);

      const verdictText = data.verdict === 'counterfeit'
        ? 'chetaavani! yah davaa nakalee hai. ise istemaal na karen.'
        : 'yah davaa sandigdh hai. kripya ise na len.';

      fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: verdictText, language: 'hi-IN' }),
      })
        .then(r => r.json())
        .then(({ audioBase64 }) => {
          if (!audioBase64) return;
          const src = `data:audio/wav;base64,${audioBase64}`;
          audioRef.current = new Audio(src);
          audioRef.current.onended = () => setAudioPlaying(false);
          setAudioReady(true);
        });

    } catch {
      setRunning(false);
    }
  }

  useEffect(() => {
    if (demoSteps.length === 0) return;
    let i = 0;
    const interval = setInterval(() => {
      setCurrentStep(i);
      i++;
      if (i >= demoSteps.length) {
        clearInterval(interval);
        setDone(true);
        setRunning(false);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
            setAudioPlaying(true);
          }
        }, 600);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [demoSteps]);

  const playAudio = () => {
    if (!audioRef.current) return;
    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      setAudioPlaying(true);
    }
  };

  return (
    <div className="container">
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Live Verification Demo</h1>
        <p className={styles.subtitle}>
          See how SafeDose catches counterfeit medicines compared to traditional QR code systems.
        </p>
      </div>

      <div className={styles.splitLayout}>
        {/* Legacy System Panel */}
        <div className={`${styles.panel} ${styles.legacyPanel}`}>
          <div className={styles.panelHeader}>
            <QrCode size={18} />
            <span>Current System (Basic QR Scan)</span>
          </div>
          <div className={styles.legacyBody}>
            <div className={styles.barcodeBox}>
              <QrCode size={48} style={{ color: 'var(--text-primary)' }} />
              <p className={styles.barcodeLabel}>BATCH-CIP-2024-015</p>
            </div>

            <div className={styles.legacyResult}>
              <CheckCircle2 size={18} className={styles.legacyCheck} />
              <span>Product Found</span>
            </div>

            <div className={styles.legacyInfo}>
              <div className={styles.legacyRow}><span>Name:</span><span>Amoxicillin 250mg</span></div>
              <div className={styles.legacyRow}><span>Code:</span><span>BATCH-CIP-2024-015</span></div>
            </div>

            <div className={styles.legacyWarning}>
              <ShieldAlert size={20} style={{ flexShrink: 0 }} />
              <span>No additional validation - cloned QR remains completely undetected.</span>
            </div>
          </div>
        </div>

        {/* SafeDose Panel */}
        <div className={`${styles.panel} ${styles.safedosePanel}`}>
          <div className={styles.panelHeader}>
            <ShieldCheck size={18} />
            <span>SafeDose 6-Layer Engine</span>
          </div>
          <div className={styles.safedoseBody}>
            <div className={styles.stepsList}>
              {demoSteps.length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--sp-6) 0', fontSize: 'var(--text-sm)' }}>
                  Press Run Verification to start the live engine simulation.
                </p>
              )}
              {demoSteps.map((step, idx) => {
                const revealed  = idx <= currentStep;
                const isSuccess = step.status === 'success';
                return (
                  <div key={step.label}
                    className={`${styles.demoStep} ${revealed ? styles.stepRevealed : ''} ${revealed && isSuccess ? styles.stepSuccess : ''} ${revealed && !isSuccess ? styles.stepFail : ''}`}
                  >
                    {!revealed ? (
                      <div className={styles.stepPending} />
                    ) : isSuccess ? (
                      <CheckCircle2 size={16} className={styles.iconSuccess} />
                    ) : (
                      <XCircle size={16} className={styles.iconFail} />
                    )}
                    <span className={styles.stepLabel}>{step.label}</span>
                    {revealed && (
                      <span className={`${styles.stepResult} ${isSuccess ? styles.resultPass : styles.resultFail}`}>
                        {isSuccess ? 'PASS' : 'FAIL'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {done && verdict && (
              <div className={styles.verdictBox} style={{
                background: verdict === 'counterfeit' ? 'var(--color-danger-bg)' : 'var(--color-suspicious-bg)',
                border: `1px solid ${verdict === 'counterfeit' ? 'var(--color-danger-border)' : 'var(--color-suspicious-border)'}`,
                color: verdict === 'counterfeit' ? 'var(--color-danger)' : 'var(--color-suspicious)',
              }}>
                {verdict === 'counterfeit' ? <ShieldX size={32} /> : <ShieldAlert size={32} />}
                <div>
                  <p className={styles.verdictLabel}>
                    {verdict === 'counterfeit' ? 'Counterfeit Detected' : 'Suspicious Medicine'}
                  </p>
                  <p className={styles.verdictSub}>Trust Score: {score}/100. Clone detection failed. QR scanned 50+ times.</p>
                </div>
              </div>
            )}

            <div className={styles.actionsRow}>
              <button className={styles.runBtn} onClick={runDemo} disabled={running}>
                {running ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : done ? <><Play size={16} /> Run Again</> : <><Play size={16} /> Run Verification</>}
              </button>

              {audioReady && done && (
                <button
                  onClick={playAudio}
                  className={styles.audioBtn}
                  style={{
                    background: audioPlaying ? 'var(--color-danger)' : 'transparent',
                    color: audioPlaying ? 'white' : 'var(--color-danger)',
                  }}
                >
                  <Volume2 size={16} />
                  {audioPlaying ? 'Playing...' : 'Hear Voice Warning'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
