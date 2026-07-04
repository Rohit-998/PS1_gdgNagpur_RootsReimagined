'use client';

import styles from './SupplyChainTracker.module.css';

/**
 * Vertical timeline showing checkpoint progression for a shipment.
 * Props: { checkpoints: Array }
 */
export default function SupplyChainTimeline({ checkpoints = [] }) {
  const sorted = [...checkpoints].sort((a, b) => a.order - b.order);

  const formatTime = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const typeLabels = {
    factory: 'Factory',
    warehouse: 'Warehouse',
    distribution_center: 'Distribution Center',
    shipment_yard: 'Shipment Yard',
    regional_hub: 'Regional Hub',
    transport_hub: 'Transport Hub',
    retail_warehouse: 'Retail Warehouse',
    pharmacy: 'Pharmacy',
    custom: 'Custom Location',
  };

  return (
    <div className={styles.timeline}>
      {sorted.map((cp, i) => {
        const isLast = i === sorted.length - 1;
        const dotClass =
          cp.status === 'completed' ? styles.timelineDotCompleted
          : cp.status === 'current' ? styles.timelineDotCurrent
          : styles.timelineDotPending;
        const lineClass =
          cp.status === 'completed' ? styles.timelineLineCompleted : '';

        return (
          <div key={cp._id || i} className={styles.timelineNode}>
            <div className={styles.timelineTrack}>
              <div className={`${styles.timelineDot} ${dotClass}`} />
              {!isLast && (
                <div className={`${styles.timelineLine} ${lineClass}`} />
              )}
            </div>
            <div className={styles.timelineContent}>
              <p className={styles.timelineCheckpointName}>{cp.name}</p>
              <p className={styles.timelineCheckpointType}>
                {typeLabels[cp.type] || cp.type}
              </p>
              {cp.actual_arrival && (
                <p className={styles.timelineTime}>
                  Arrived: {formatTime(cp.actual_arrival)}
                </p>
              )}
              {cp.departure_time && (
                <p className={styles.timelineTime}>
                  Departed: {formatTime(cp.departure_time)}
                </p>
              )}
              {!cp.actual_arrival && cp.expected_arrival && (
                <p className={styles.timelineTime}>
                  ETA: {formatTime(cp.expected_arrival)}
                </p>
              )}
              {cp.notes && (
                <p className={styles.timelineNotes}>{cp.notes}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
