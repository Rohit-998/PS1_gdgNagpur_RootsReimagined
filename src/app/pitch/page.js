'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, ShieldAlert, ShieldX, Skull, QrCode, Mic, 
  BarChart2, Flag, Zap, Globe, Lock, ArrowRight, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle, Users, Building2, Activity
} from 'lucide-react';

const SLIDES = [
  // Slide 0 — Hook
  {
    id: 'hook',
    bg: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)',
    content: (
      <div style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
        <Skull size={64} style={{ color: '#DC2626', margin: '0 auto 1.5rem', filter: 'drop-shadow(0 0 20px rgba(220,38,38,0.5))' }} />
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: '1.5rem' }}>
          Every Year, <span style={{ color: '#DC2626' }}>1 Million People Die</span> From Fake Medicines
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginTop: '2rem' }}>
          {[
            { stat: '20+ Children', desc: 'Died in MP, India (2025) — contaminated Coldrif cough syrup', color: '#DC2626' },
            { stat: '70 Children', desc: 'Died in Gambia (2022) — toxic Maiden Pharma syrups', color: '#F59E0B' },
            { stat: '$4.4 Billion', desc: 'Global counterfeit pharma market annually (WHO)', color: '#7C3AED' },
          ].map(({ stat, desc, color }) => (
            <div key={stat} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.25rem', borderTop: `3px solid ${color}` }}>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color, margin: '0 0 0.5rem' }}>{stat}</p>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.4 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // Slide 1 — Problem
  {
    id: 'problem',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    content: (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fff', marginBottom: '0.75rem', textAlign: 'center' }}>
          The Problem: <span style={{ color: '#F59E0B' }}>QR Codes Can Be Cloned</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '1rem', marginBottom: '2rem' }}>Current systems only check if a code exists — not if it&apos;s legitimate</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <XCircle size={20} style={{ color: '#DC2626' }} />
              <h3 style={{ color: '#DC2626', fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>Current System</h3>
            </div>
            <ul style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.8, paddingLeft: '1rem', margin: 0 }}>
              <li>Single barcode/QR lookup</li>
              <li>No tamper detection</li>
              <li>Clone goes undetected</li>
              <li>No geographic tracking</li>
              <li>No expiry verification</li>
            </ul>
          </div>
          <div style={{ background: 'rgba(91,70,255,0.08)', border: '1px solid rgba(91,70,255,0.3)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <CheckCircle2 size={20} style={{ color: '#5B46FF' }} />
              <h3 style={{ color: '#5B46FF', fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>SafeDose Solution</h3>
            </div>
            <ul style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.8, paddingLeft: '1rem', margin: 0 }}>
              <li><strong>6-layer</strong> verification engine</li>
              <li>SHA-256 cryptographic hashing</li>
              <li>Clone detection via scan frequency</li>
              <li>GPS-based diversion detection</li>
              <li>Real-time supply chain audit</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },

  // Slide 2 — The 6-Layer Engine
  {
    id: 'engine',
    bg: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)',
    content: (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fff', marginBottom: '2rem', textAlign: 'center' }}>
          The <span style={{ color: '#D2F803' }}>6-Layer</span> Verification Engine
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {[
            { icon: QrCode, name: 'Batch Validation', pts: '30 pts', desc: 'Verifies batch_id + serial exists in manufacturer DB', color: '#5B46FF' },
            { icon: Lock, name: 'Hash Verification', pts: '25 pts', desc: 'SHA-256 cryptographic signature prevents tampering', color: '#7C3AED' },
            { icon: Users, name: 'Clone Detection', pts: '20 pts', desc: 'Scan frequency analysis catches duplicate QR codes', color: '#F59E0B' },
            { icon: Globe, name: 'Geo Validation', pts: '10 pts', desc: 'GPS reverse geocoding detects diverted medicines', color: '#059669' },
            { icon: Activity, name: 'Temporal Check', pts: '10 pts', desc: 'MFG/EXP date validation catches expired relabeling', color: '#0EA5E9' },
            { icon: Building2, name: 'Supply Chain', pts: '5 pts', desc: 'Hash-linked chain from factory → pharmacy', color: '#EC4899' },
          ].map(({ icon: Icon, name, pts, desc, color }) => (
            <div key={name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Icon size={22} style={{ color, flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ color: '#fff', fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>{name}</p>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color, background: `${color}20`, padding: '2px 6px', borderRadius: '4px' }}>{pts}</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: '4px 0 0', lineHeight: 1.4 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // Slide 3 — Key Features
  {
    id: 'features',
    bg: 'linear-gradient(135deg, #16213e 0%, #1a1a2e 100%)',
    content: (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fff', marginBottom: '2rem', textAlign: 'center' }}>
          Beyond Verification — <span style={{ color: '#D2F803' }}>Full Ecosystem</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {[
            { icon: Mic, title: 'AI Voice Assistant', desc: '10 Indian languages via Sarvam AI — speaks verification results aloud for illiterate users', color: '#7C3AED' },
            { icon: Flag, title: 'Anonymous Reporting', desc: 'Voice-guided counterfeit reporting with OTP verification in local languages', color: '#DC2626' },
            { icon: ShieldAlert, title: 'Drug Interactions', desc: 'Cross-reference medicines to catch dangerous drug combinations', color: '#F59E0B' },
            { icon: BarChart2, title: 'Trust Leaderboard', desc: 'Public pharmacy ranking based on verification integrity scores', color: '#059669' },
            { icon: Zap, title: 'Gemini AI Chatbot', desc: 'Ask questions about dosage, side effects, and alternatives', color: '#0EA5E9' },
            { icon: Building2, title: 'Admin Dashboard', desc: 'Real-time monitoring for regulators and manufacturers', color: '#EC4899' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1.25rem' }}>
              <Icon size={24} style={{ color, marginBottom: '0.75rem' }} />
              <p style={{ color: '#fff', fontWeight: 700, margin: '0 0 0.25rem', fontSize: '0.95rem' }}>{title}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // Slide 4 — Tech Stack
  {
    id: 'tech',
    bg: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)',
    content: (
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fff', marginBottom: '2rem' }}>
          Tech Stack
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          {[
            { name: 'Next.js 14', role: 'Full-stack Framework', color: '#fff' },
            { name: 'MongoDB', role: 'NoSQL Database', color: '#059669' },
            { name: 'Sarvam AI', role: 'TTS in 10 Languages', color: '#7C3AED' },
            { name: 'Google Gemini', role: 'AI Chatbot', color: '#0EA5E9' },
            { name: 'SHA-256', role: 'Crypto Hashing', color: '#F59E0B' },
            { name: 'Web Speech API', role: 'Voice Input', color: '#EC4899' },
            { name: 'Nominatim', role: 'Reverse Geocoding', color: '#059669' },
            { name: 'Vercel', role: 'Edge Deployment', color: '#fff' },
          ].map(({ name, role, color }) => (
            <div key={name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
              <p style={{ color, fontWeight: 700, fontSize: '1rem', margin: '0 0 4px' }}>{name}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', margin: 0 }}>{role}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // Slide 5 — CTA
  {
    id: 'cta',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #5B46FF 100%)',
    content: (
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <ShieldCheck size={64} style={{ color: '#D2F803', margin: '0 auto 1.5rem', filter: 'drop-shadow(0 0 20px rgba(210,248,3,0.4))' }} />
        <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#fff', marginBottom: '1rem', lineHeight: 1.15 }}>
          SafeDose: Saving Lives,<br />One Scan at a Time
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          Built for India. Built for accessibility. Built to end counterfeit medicine deaths.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/scan" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: '#D2F803', color: '#111', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
            <QrCode size={20} /> Try Live Demo <ArrowRight size={16} />
          </Link>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>
            View Homepage
          </Link>
        </div>
      </div>
    ),
  },
];

export default function PitchPage() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrent(c => Math.min(c + 1, SLIDES.length - 1));
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrent(c => Math.max(c - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const slide = SLIDES[current];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: slide.bg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '2rem',
        transition: 'background 0.5s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Slide Content */}
      <div key={slide.id} style={{ animation: 'fade-in 0.4s ease-out' }}>
        {slide.content}
      </div>

      {/* Navigation */}
      <div style={{
        position: 'fixed', bottom: '2rem', left: 0, right: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem',
        zIndex: 100,
      }}>
        <button
          onClick={() => setCurrent(c => Math.max(c - 1, 0))}
          disabled={current === 0}
          style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.3 : 1, fontWeight: 600, backdropFilter: 'blur(10px)' }}
        >
          ← Prev
        </button>

        <div style={{ display: 'flex', gap: '6px' }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? '24px' : '8px', height: '8px',
                borderRadius: '4px', border: 'none', cursor: 'pointer',
                background: i === current ? '#D2F803' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrent(c => Math.min(c + 1, SLIDES.length - 1))}
          disabled={current === SLIDES.length - 1}
          style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: current === SLIDES.length - 1 ? 'not-allowed' : 'pointer', opacity: current === SLIDES.length - 1 ? 0.3 : 1, fontWeight: 600, backdropFilter: 'blur(10px)' }}
        >
          Next →
        </button>
      </div>

      {/* Slide counter */}
      <div style={{ position: 'fixed', top: '1.5rem', right: '2rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace', zIndex: 100 }}>
        {current + 1} / {SLIDES.length}
      </div>
    </div>
  );
}
