'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './Footer.module.css';

export default function Footer() {
  const pathname = usePathname();
  const isHome   = pathname === '/';

  return (
    <footer className={styles.footer}>

      {/* CTA Banner – home only */}
      {isHome && (
        <div className={styles.ctaSection}>
          <div className={`container ${styles.ctaInner}`}>
            <div className={styles.ctaText}>
              <h2 className={styles.ctaHeadline}>
                Ready to verify medicines with confidence?
              </h2>
              <p className={styles.ctaSub}>
                Multi-layer pharmaceutical verification using cryptographic signatures,
                supply chain validation, and real-time counterfeit detection.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link href="/scan" className={styles.ctaPrimary}>
                Start Verification
              </Link>
              <Link href="/demo" className={styles.ctaSecondary}>
                See How It Works
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Footer */}
      <div className={styles.footerMain}>
        <div className={`container ${styles.footerGrid}`}>

          {/* Brand */}
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.footerLogo}>
              <Image src="/logo.svg" alt="SafeDose" width={28} height={28} />
              <span>SafeDose</span>
            </Link>
            <p className={styles.footerDesc}>
              Pharmaceutical authenticity verification for consumers, pharmacies,
              manufacturers, and regulators.
            </p>
          </div>

          {/* Platform */}
          <div className={styles.footerCol}>
            <span className={styles.colTitle}>Platform</span>
            <Link href="/"            className={styles.footerLink}>Home</Link>
            <Link href="/scan"        className={styles.footerLink}>Scan Medicine</Link>
            <Link href="/history"     className={styles.footerLink}>Scan History</Link>
            <Link href="/pharmacies"  className={styles.footerLink}>Pharmacies</Link>
            <Link href="/interactions"className={styles.footerLink}>Drug Interactions</Link>
          </div>

          {/* Verification */}
          <div className={styles.footerCol}>
            <span className={styles.colTitle}>Verification</span>
            <Link href="/demo" className={styles.footerLink}>Batch Verification</Link>
            <Link href="/demo" className={styles.footerLink}>Hash Validation</Link>
            <Link href="/demo" className={styles.footerLink}>Clone Detection</Link>
            <Link href="/demo" className={styles.footerLink}>Geo Validation</Link>
            <Link href="/demo" className={styles.footerLink}>Supply Chain</Link>
          </div>

          {/* Account */}
          <div className={styles.footerCol}>
            <span className={styles.colTitle}>Account</span>
            <Link href="/login"  className={styles.footerLink}>Sign In</Link>
            <Link href="/signup" className={styles.footerLink}>Create Account</Link>
            <Link href="/report" className={styles.footerLink}>Report Counterfeit</Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.footerBottom}>
        <div className={`container ${styles.footerBottomInner}`}>
          <span>© {new Date().getFullYear()} SafeDose. All rights reserved.</span>
          <span className={styles.footerMeta}>Built for pharmaceutical authenticity · v1.0</span>
        </div>
      </div>
    </footer>
  );
}
