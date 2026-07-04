'use client';
import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { QrCode, FileCheck, Shield, Truck, AlertTriangle, CheckCircle } from 'lucide-react';
import './VerificationWorkflow.css';

const STEPS = [
  {
    num: '01',
    icon: QrCode,
    title: 'Scan Medicine Package',
    desc: 'Scan a QR code or manually enter a batch identifier to begin verification.',
  },
  {
    num: '02',
    icon: FileCheck,
    title: 'Batch Verification',
    desc: 'Validate that the package exists in authorized manufacturer records.',
  },
  {
    num: '03',
    icon: Shield,
    title: 'Cryptographic Validation',
    desc: 'Verify the package identity using secure digital signatures and hash validation.',
  },
  {
    num: '04',
    icon: Truck,
    title: 'Supply Chain Integrity',
    desc: 'Confirm that the package has passed through expected distribution checkpoints.',
  },
  {
    num: '05',
    icon: AlertTriangle,
    title: 'Anomaly Detection',
    desc: 'Identify duplicate scans, unusual activity patterns, and potential cloning attempts.',
  },
  {
    num: '06',
    icon: CheckCircle,
    title: 'Trust Assessment',
    desc: 'Generate an authenticity score and risk level based on all verification signals.',
  },
];

export default function VerificationWorkflow() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setVisibleCount(i + 1), i * 220 + 50)
    );
    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  const activeIdx = visibleCount > 0 ? visibleCount - 1 : -1;

  return (
    <div ref={sectionRef} className="vw-section">
      <div className="vw-header">
        <h2 className="vw-heading">How SafeDose Works</h2>
        <p className="vw-subheading">
          Every package is evaluated through multiple verification layers before an
          authenticity assessment is generated.
        </p>
      </div>

      <div className="vw-body">
        <div className="vw-rail-track">
          <motion.div
            className="vw-rail-fill"
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{
              duration: 1.7,
              ease: [0.25, 0.1, 0.25, 1],
              delay: 0.05,
            }}
            style={{ transformOrigin: 'top' }}
          />
        </div>

        <div className="vw-grid">
          {STEPS.map((step, i) => (
            <div key={step.num} className="vw-row">
              <div className="vw-node-cell">
                <div className={`vw-node ${i <= activeIdx ? 'active' : ''}`} />
              </div>
              <motion.div
                className={`vw-card ${i === activeIdx ? 'active' : ''} ${i < activeIdx ? 'completed' : ''}`}
                initial={{ opacity: 0, x: 50 }}
                animate={
                  isInView && i < visibleCount
                    ? { opacity: 1, x: 0 }
                    : {}
                }
                transition={{
                  duration: 0.45,
                  delay: i * 0.22,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <div className="vw-card-left">
                  <span className="vw-step-num">{step.num}</span>
                  <step.icon size={16} className="vw-step-icon" />
                </div>
                <div className="vw-card-content">
                  <h3 className="vw-card-title">{step.title}</h3>
                  <p className="vw-card-desc">{step.desc}</p>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
