'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { QrCode, ArrowRight, ShieldCheck, GitMerge, ScanLine, Activity, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import VerificationWorkflow from '@/components/VerificationWorkflow';
import VerificationIntelligence from '@/components/VerificationIntelligence';
import styles from './page.module.css';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Batch Verification',
    desc: 'Validates that the package exists in authorized manufacturer records.',
  },
  {
    icon: QrCode,
    title: 'Cryptographic Validation',
    desc: 'Verifies identity using secure digital signatures and SHA-256 hash matching.',
  },
  {
    icon: ScanLine,
    title: 'Clone Detection',
    desc: 'Identifies reused or duplicated QR codes — a primary indicator of counterfeiting.',
  },
  {
    icon: MapPin,
    title: 'Geographic Validation',
    desc: 'Detects medicines distributed outside their authorized geographic regions.',
  },
  {
    icon: Clock,
    title: 'Temporal Validation',
    desc: 'Flags expired medicines and detects scans outside expected time windows.',
  },
  {
    icon: GitMerge,
    title: 'Supply Chain Integrity',
    desc: 'Traces the full journey from factory to pharmacy via verified checkpoints.',
  },
];

export default function Home() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>

          <motion.div
            className={styles.heroText}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >


            <h1 className={styles.heroTitle}>
              VERIFY MEDICINE<br />
              AUTHENTICITY <span style={{ fontWeight: 400, fontStyle: 'italic' }}>IN SECONDS</span>
            </h1>

            <p className={styles.heroSub}>
              Multi-layer pharmaceutical verification using cryptographic signatures, supply chain validation, and counterfeit detection.
            </p>

            <div className={styles.heroCtas}>
              <Link href="/scan" className={`${styles.ctaPrimary}`}>
                <QrCode size={18} />
                Start Verification
              </Link>
              <Link href="/demo" className={styles.ctaSecondary}>
                View Demo
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            className={styles.statsStrip}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
          >
            {[
              { label: 'Medicines Verified',         value: stats?.totalScans },
              { label: 'Counterfeits Detected Today', value: stats?.counterfeitsToday },
              { label: 'Total Counterfeits Found',   value: stats?.totalCounterfeits },
              { label: 'Pharmacies Monitored',       value: stats?.pharmaciesFlagged },
            ].map(({ label, value }) => (
              <div key={label} className={styles.statItem}>
                <CountUpStat value={value} />
                <span className={styles.statLabel}>{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className={styles.workflowSection}>
        <div className="container">
          <VerificationWorkflow />
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section className={styles.featuresSection}>
        <div className="container">
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
          >
            <h2 className={styles.sectionTitle}>Six layers of verification</h2>
            <p className={styles.sectionSub}>
              Every medicine scan passes through independent security checks
              before a trust score is generated.
            </p>
          </motion.div>

          <div className={styles.featureGrid}>
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                className={styles.featureCard}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div className={styles.featureIconWrap}>
                  <Icon size={24} />
                </div>
                <h3 className={styles.featureTitle}>{title}</h3>
                <p className={styles.featureDesc}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Engine ── */}
      <section className={styles.intelligenceSection}>
        <VerificationIntelligence />
      </section>

    </div>
  );
}

/* CountUp helper */
function CountUpStat({ value }) {
  const [count, setCount]       = useState(0);
  const [visible, setVisible]   = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || value == null) return;
    const dur  = 1400;
    const start = performance.now();
    const animate = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(2, -10 * t);
      setCount(Math.floor(ease * value));
      if (t < 1) requestAnimationFrame(animate);
      else setCount(value);
    };
    requestAnimationFrame(animate);
  }, [visible, value]);

  return (
    <span ref={ref} className={styles.statValue}>
      {value == null ? '—' : count.toLocaleString()}
    </span>
  );
}
