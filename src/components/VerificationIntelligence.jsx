'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FileKey, Database, PackageSearch, GitMerge, Clock, Activity } from 'lucide-react';

const CAPABILITIES = [
  {
    title: 'Digital Signature Verification',
    desc: 'Validates manufacturer-issued cryptographic signatures to ensure package identity has not been altered.',
    icon: FileKey,
    delay: 1,
  },
  {
    title: 'Hash Integrity Validation',
    desc: 'Recomputes and validates payload hashes to detect tampering and data inconsistencies.',
    icon: Database,
    delay: 2,
  },
  {
    title: 'Batch Verification',
    desc: 'Confirms that the scanned batch exists within authorized manufacturer records.',
    icon: PackageSearch,
    delay: 3,
  },
  {
    title: 'Supply Chain Validation',
    desc: 'Verifies package movement through expected distribution checkpoints and identifies missing events.',
    icon: GitMerge,
    delay: 1,
  },
  {
    title: 'Temporal Validation',
    desc: 'Validates manufacturing and expiration timelines to prevent distribution of expired or recalled products.',
    icon: Clock,
    delay: 2,
  },
  {
    title: 'Duplicate Scan Analysis',
    desc: 'Monitors repeated scan activity and identifies patterns commonly associated with cloned identifiers.',
    icon: Activity,
    delay: 3,
  },
];

export default function VerificationIntelligence() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className="container">
      {/* Header */}
      <div
        className={isVisible ? 'animate-fade-in-up' : ''}
        style={{
          opacity: isVisible ? undefined : 0,
          marginBottom: 'var(--sp-10)',
          maxWidth: '600px',
        }}
      >
        <h2 style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginBottom: 'var(--sp-3)',
        }}>
          Trust engine
        </h2>
        <p style={{
          fontSize: 'var(--text-lg)',
          color: 'var(--text-secondary)',
          lineHeight: 1.65,
        }}>
          SafeDose evaluates every package through multiple independent verification layers
          to identify authenticity signals and counterfeit risk indicators.
        </p>
      </div>

      {/* Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--sp-4)',
      }}>
        {CAPABILITIES.map((cap) => (
          <CapabilityCard key={cap.title} cap={cap} isVisible={isVisible} />
        ))}
      </div>
    </div>
  );
}

function CapabilityCard({ cap, isVisible }) {
  const Icon = cap.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={isVisible ? `animate-fade-in animate-delay-${cap.delay}` : ''}
      style={{
        opacity: isVisible ? undefined : 0,
        animationFillMode: 'forwards',
        background: 'var(--bg-surface)',
        border: `1px solid ${hovered ? 'var(--border-default)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-md)',
        padding: 'var(--sp-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-3)',
        boxShadow: hovered ? 'var(--shadow-sm)' : 'none',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'border-color var(--ease-fast), box-shadow var(--ease-fast), transform var(--ease-fast)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: '36px',
        height: '36px',
        background: 'var(--color-brand-primary-tint)',
        color: 'var(--color-brand-primary)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={18} />
      </div>
      <h3 style={{
        fontSize: 'var(--text-base)',
        fontWeight: 600,
        color: 'var(--text-primary)',
        lineHeight: 1.35,
      }}>
        {cap.title}
      </h3>
      <p style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
        lineHeight: 1.65,
      }}>
        {cap.desc}
      </p>
    </div>
  );
}
