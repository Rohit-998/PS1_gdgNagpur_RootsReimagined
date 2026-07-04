'use client';

import { MonitorX } from 'lucide-react';
import styles from './layout.module.css';

export default function DashboardLayout({ children }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.desktopContent}>
        {children}
      </div>
      <div className={styles.mobileWarning}>
        <MonitorX size={48} className={styles.icon} strokeWidth={1.5} />
        <h2 className={styles.title}>Desktop Required</h2>
        <p className={styles.desc}>
          The dashboard is optimized for larger screens. Please switch to a desktop or tablet device to access these features.
        </p>
      </div>
    </div>
  );
}
