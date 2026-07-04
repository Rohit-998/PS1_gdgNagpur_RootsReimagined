'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import jsQR from 'jsqr';
import {
  QrCode, Keyboard, History, CheckCircle2, Circle,
  AlertTriangle, XCircle, Upload, Loader2, Camera, CameraOff, MapPin
} from 'lucide-react';
import styles from './page.module.css';

const GeoMap = dynamic(() => import('@/components/GeoMap'), { ssr: false });

const STEP_IDS    = ['batch', 'hash', 'clone', 'geo', 'temp', 'supply'];
const STEP_LABELS = {
  batch:  'Batch Validation',
  hash:   'Hash Verification',
  clone:  'Clone Detection',
  geo:    'Geo Validation',
  temp:   'Temporal Validation',
  supply: 'Supply Chain Check',
};

export default function ScanPage() {
  const router       = useRouter();
  const fileInputRef = useRef(null);
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const streamRef    = useRef(null);
  const scanLoopRef  = useRef(null);

  const [activeTab,           setActiveTab]           = useState('scan');
  const [manualBatch,         setManualBatch]         = useState('');
  const [manualSerial,        setManualSerial]        = useState('');
  const [verificationSteps,   setVerificationSteps]   = useState(
    STEP_IDS.map(id => ({ id, label: STEP_LABELS[id], status: 'pending' }))
  );
  const [isVerifying,         setIsVerifying]         = useState(false);
  const [error,               setError]               = useState('');
  const [recentScans,         setRecentScans]         = useState([]);
  const [cameraActive,        setCameraActive]        = useState(false);
  const [cameraError,         setCameraError]         = useState('');
  const [mapReady,            setMapReady]            = useState(false);
  const [verificationVerdict, setVerificationVerdict] = useState(null);
  const locationRef = useRef({});

  // Pre-fetch location
  useEffect(() => {
    (async () => {
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        let region = 'Unknown';
        try {
          const geoRes  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=en`);
          const geoData = await geoRes.json();
          region = geoData?.address?.state || geoData?.address?.city || 'Unknown';
        } catch {}
        locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude, region };
        setMapReady(true);
      } catch {}
    })();
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(e => { if (e.name !== 'AbortError') throw e; });
      }
      setCameraActive(true);
      startScanLoop();
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') {
        setCameraError('Camera access denied or no camera found. Use image upload instead.');
      } else {
        setCameraError('Could not start the camera. Use image upload instead.');
      }
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) { cancelAnimationFrame(scanLoopRef.current); scanLoopRef.current = null; }
    if (streamRef.current)   { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current)    { videoRef.current.srcObject = null; }
    setCameraActive(false);
  }, []);

  const startScanLoop = useCallback(() => {
    const scan = () => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) {
        scanLoopRef.current = requestAnimationFrame(scan);
        return;
      }
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx       = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code      = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
      if (code) { stopCamera(); processQRData(code.data); return; }
      scanLoopRef.current = requestAnimationFrame(scan);
    };
    scanLoopRef.current = requestAnimationFrame(scan);
  }, [stopCamera]);

  const processQRData = useCallback((rawData) => {
    try {
      const qrData = JSON.parse(rawData);
      if (qrData.batch_id && qrData.serial_number && qrData.hash) {
        runVerification(qrData);
        return;
      }
    } catch {}
    setError('QR code is not a valid SafeDose code.');
  }, []);

  useEffect(() => { return () => stopCamera(); }, [stopCamera]);

  useEffect(() => {
    if (activeTab === 'scan' && !cameraActive && !isVerifying) { startCamera(); }
    else if (activeTab !== 'scan') { stopCamera(); }
  }, [activeTab]);

  const animateSteps = (results) => {
    const keys = ['batchCheck', 'hashCheck', 'scanFrequency', 'geoCheck', 'temporalCheck', 'supplyChain'];
    keys.forEach((key, i) => {
      setTimeout(() => {
        const result = results[key];
        const status = result?.passed ? 'success' : 'error';
        setVerificationSteps(prev => prev.map((step, idx) => idx === i ? { ...step, status } : step));
      }, i * 500);
    });
  };

  const runVerification = async (qrData) => {
    setIsVerifying(true);
    setError('');
    setVerificationVerdict(null);
    setVerificationSteps(STEP_IDS.map(id => ({ id, label: STEP_LABELS[id], status: 'pending' })));

    const userLocation = locationRef.current;
    const token        = typeof window !== 'undefined' ? localStorage.getItem('mg_token') : null;

    try {
      const res  = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ qrData, userLocation }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      animateSteps(data.results);
      setVerificationVerdict(data.verdict);

      try {
        const history = JSON.parse(localStorage.getItem('mg_scan_history') || '[]');
        history.unshift({
          name:    data.medicineInfo?.name || qrData.batch_id,
          batch:   qrData.batch_id,
          verdict: data.verdict,
          score:   data.totalScore,
          time:    new Date().toISOString(),
        });
        localStorage.setItem('mg_scan_history', JSON.stringify(history.slice(0, 20)));
      } catch {}

      setRecentScans(prev => [
        { label: data.medicineInfo?.name || qrData.batch_id, verdict: data.verdict, score: data.totalScore, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 4),
      ]);

      setTimeout(() => {
        const params = new URLSearchParams({ data: JSON.stringify(data) });
        router.push(`/results?${params.toString()}`);
      }, STEP_IDS.length * 500 + 800);

    } catch (err) {
      setError(err.message || 'Verification failed');
      setIsVerifying(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const tryWidths = [img.width, Math.min(img.width, 800), Math.min(img.width, 1200)];
      let code = null;
      for (const w of tryWidths) {
        if (code) break;
        const scale = w / img.width;
        const cw = Math.round(img.width * scale);
        const ch = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, cw, ch);
        const imageData = ctx.getImageData(0, 0, cw, ch);
        code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
      }
      if (!code) {
        const canvas = document.createElement('canvas');
        const cw = Math.min(img.width, 600);
        const ch = Math.round(img.height * (cw / img.width));
        canvas.width = cw; canvas.height = ch;
        const ctx = canvas.getContext('2d');
        ctx.filter = 'contrast(1.5) brightness(1.1)';
        ctx.drawImage(img, 0, 0, cw, ch);
        ctx.filter = 'none';
        const imageData = ctx.getImageData(0, 0, cw, ch);
        code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
      }
      if (!code) {
        setError('No QR code found in this image. Try a clearer photo or hold the camera closer to the QR code.');
        return;
      }
      try {
        const qrData = JSON.parse(code.data);
        if (!qrData.batch_id || !qrData.serial_number || !qrData.hash) { setError('QR code is not a valid SafeDose code.'); return; }
        runVerification(qrData);
      } catch { setError('QR code is not a valid SafeDose code.'); }
    };
    img.onerror = () => setError('Could not load the image.');
    img.src = url;
    e.target.value = '';
  };

  const handleManualVerify = () => {
    if (!manualBatch.trim() || !manualSerial.trim()) {
      setError('Please enter both Batch ID and Serial Number.');
      return;
    }
    runVerification({ batch_id: manualBatch.trim(), serial_number: manualSerial.trim(), hash: '' });
  };

  const verdictColor = (verdict) =>
    verdict === 'verified'   ? 'var(--color-verified)'   :
    verdict === 'suspicious' ? 'var(--color-suspicious)' :
                               'var(--color-danger)';

  return (
    <div className={`container ${styles.scanContainer}`}>

      <div className={styles.header}>
        <h1 className={styles.title}>Verify Medicine</h1>
        <p className={styles.subtitle}>Scan a QR code or enter batch details to run a six-layer authenticity check.</p>
      </div>

      <div className={styles.layout}>

        {/* Left Column */}
        <div>
          <div className={styles.inputCard}>
            {/* Tabs */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'scan' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('scan')}
              >
                <QrCode size={15} /> QR Scanner
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'manual' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('manual')}
              >
                <Keyboard size={15} /> Manual Entry
              </button>
            </div>

            <div className={styles.inputContent}>
              {activeTab === 'scan' ? (
                <div className={styles.scannerContainer}>
                  {/* Scanner Frame */}
                  <div className={styles.scannerFrame}>
                    <video ref={videoRef} playsInline muted className={styles.videoFeed} />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    {cameraActive && <div className={styles.scannerLine} />}
                    <div className={`${styles.scannerCorner} ${styles.tl}`} />
                    <div className={`${styles.scannerCorner} ${styles.tr}`} />
                    <div className={`${styles.scannerCorner} ${styles.bl}`} />
                    <div className={`${styles.scannerCorner} ${styles.br}`} />
                    {!cameraActive && (
                      <p className={styles.scannerText}>
                        {cameraError || 'Tap below to start camera or upload a QR image'}
                      </p>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />

                  <div className={styles.scannerActions}>
                    {!cameraActive ? (
                      <button
                        className={`${styles.fullWidthBtn} ${styles.fullWidthBtnPrimary}`}
                        onClick={startCamera}
                        disabled={isVerifying}
                      >
                        <Camera size={16} /> Open Camera
                      </button>
                    ) : (
                      <button className={styles.fullWidthBtn} onClick={stopCamera}>
                        <CameraOff size={16} /> Stop Camera
                      </button>
                    )}
                    <button
                      className={styles.fullWidthBtn}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isVerifying}
                    >
                      {isVerifying
                        ? <><Loader2 size={16} className="animate-spin" /> Verifying...</>
                        : <><Upload size={16} /> Upload QR</>
                      }
                    </button>
                  </div>

                  {(error || cameraError) && (
                    <p className={styles.errorText}>{error || cameraError}</p>
                  )}
                </div>
              ) : (
                <div className={styles.manualEntry}>
                  <div className={styles.formGroup}>
                    <label htmlFor="batchId">Batch ID</label>
                    <input
                      id="batchId"
                      type="text"
                      placeholder="e.g. BATCH-SUN-2024-001"
                      className={styles.input}
                      value={manualBatch}
                      onChange={e => setManualBatch(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="serialNum">Serial Number</label>
                    <input
                      id="serialNum"
                      type="text"
                      placeholder="e.g. SN-0001"
                      className={styles.input}
                      value={manualSerial}
                      onChange={e => setManualSerial(e.target.value)}
                    />
                  </div>
                  {error && <p className={styles.errorText}>{error}</p>}
                  <button
                    className={`${styles.fullWidthBtn} ${styles.fullWidthBtnPrimary}`}
                    onClick={handleManualVerify}
                    disabled={isVerifying}
                  >
                    {isVerifying
                      ? <><Loader2 size={16} className="animate-spin" /> Verifying...</>
                      : 'Run Verification'
                    }
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Scans */}
          <div className={styles.recentScans}>
            <p className={styles.sectionTitle}>
              <History size={13} /> Recent Scans
            </p>
            <div className={styles.recentList}>
              {recentScans.length === 0 ? (
                <p className={styles.emptyState}>No scans yet in this session.</p>
              ) : (
                recentScans.map((scan, i) => (
                  <div key={i} className={styles.recentItem}>
                    <div>
                      <p className={styles.recentName}>{scan.label}</p>
                      <p className={styles.recentTime}>{scan.time}</p>
                    </div>
                    <span className={styles.recentScore} style={{ color: verdictColor(scan.verdict) }}>
                      {scan.score}/100
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Geo Map */}
          {mapReady ? (
            <div className={styles.geoCard}>
              <div className={styles.geoCardHeader}>
                <MapPin size={14} style={{ color: 'var(--color-brand-primary)' }} />
                <span className={styles.geoLabel}>Geo Validation</span>
                {verificationVerdict && (
                  <span className={`status-badge badge-${verificationVerdict}`}>
                    {locationRef.current.region || 'Located'}
                  </span>
                )}
              </div>
              <GeoMap
                lat={locationRef.current.lat}
                lng={locationRef.current.lng}
                city={locationRef.current.region || 'your location'}
                verifying={isVerifying}
                resultVerdict={verificationVerdict}
              />
            </div>
          ) : (
            <div className={styles.geoDisabledCard}>
              <p className={styles.geoDisabledText}>
                Enable location access to activate geographic validation.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Verification Progress */}
        <div>
          <div className={styles.progressCard}>
            <div className={styles.panelHeader}>
              <p className={styles.panelTitle}>Verification Progress</p>
            </div>

            <div className={styles.stepsList}>
              {verificationSteps.map((step) => (
                <div key={step.id} className={styles.step}>
                  <div className={styles.stepIcon}>
                    {step.status === 'pending' && <Circle       size={16} className={styles.iconPending} />}
                    {step.status === 'success' && <CheckCircle2 size={16} className={styles.iconSuccess} />}
                    {step.status === 'warning' && <AlertTriangle size={16} className={styles.iconWarning} />}
                    {step.status === 'error'   && <XCircle       size={16} className={styles.iconError}   />}
                  </div>
                  <span className={`${styles.stepLabel} ${styles[`text-${step.status}`]}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.progressFooter}>
              <p className={styles.waitingText}>
                {isVerifying
                  ? <><Loader2 size={13} className="animate-spin" /> Running verification layers...</>
                  : 'Waiting for input...'
                }
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
