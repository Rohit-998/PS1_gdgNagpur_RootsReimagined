// Anomaly Detection Engine
// Rule-based analysis of scan patterns to detect emerging counterfeit activity

import ScanLog from '../models/ScanLog.js';
import Medicine from '../models/Medicine.js';
import connectDB from '../lib/mongodb.js';

/**
 * Run all anomaly detection rules and return active alerts
 */
export async function detectAnomalies() {
  await connectDB();

  const alerts = [];

  // Rule 1: Velocity Check — same serial scanned in multiple cities within 1 hour
  const velocityAlerts = await detectVelocityAnomalies();
  alerts.push(...velocityAlerts);

  // Rule 2: Burst Detection — sudden spike in scans for a single batch
  const burstAlerts = await detectBurstAnomalies();
  alerts.push(...burstAlerts);

  // Rule 3: Geographic Dispersion — batch scanned across too many regions
  const geoAlerts = await detectGeographicDispersion();
  alerts.push(...geoAlerts);

  // Rule 4: Low Score Pattern — many scans for a batch resulting in low scores
  const lowScoreAlerts = await detectLowScorePatterns();
  alerts.push(...lowScoreAlerts);

  return alerts;
}

/**
 * Rule 1: Velocity Anomaly
 * Same medicine scanned in different cities within a short time window
 * (physically impossible to move that fast)
 */
async function detectVelocityAnomalies() {
  const alerts = [];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Get recent scans grouped by medicine
  const recentScans = await ScanLog.aggregate([
    { $match: { scanned_at: { $gte: oneHourAgo }, location_city: { $ne: null } } },
    {
      $group: {
        _id: '$medicine_id',
        cities: { $addToSet: '$location_city' },
        count: { $sum: 1 },
        batch_id: { $first: '$scanned_batch_id' },
        serial: { $first: '$scanned_serial_number' },
      }
    },
    { $match: { 'cities.1': { $exists: true } } } // At least 2 different cities
  ]);

  for (const scan of recentScans) {
    if (scan.cities.length >= 2) {
      alerts.push({
        type: 'velocity_anomaly',
        severity: 'high',
        title: 'Impossible Travel Detected',
        description: `Batch ${scan.batch_id || 'Unknown'} (Serial: ${scan.serial || 'Unknown'}) was scanned in ${scan.cities.length} different cities within 1 hour: ${scan.cities.join(', ')}. This is physically impossible and indicates QR code cloning.`,
        batch_id: scan.batch_id,
        cities: scan.cities,
        scan_count: scan.count,
        detected_at: new Date(),
      });
    }
  }

  return alerts;
}

/**
 * Rule 2: Burst Detection
 * More than 10 scans of the same serial in the last 24 hours
 */
async function detectBurstAnomalies() {
  const alerts = [];
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const bursts = await ScanLog.aggregate([
    { $match: { scanned_at: { $gte: twentyFourHoursAgo } } },
    {
      $group: {
        _id: { batch: '$scanned_batch_id', serial: '$scanned_serial_number' },
        count: { $sum: 1 },
        cities: { $addToSet: '$location_city' },
      }
    },
    { $match: { count: { $gte: 10 } } },
    { $sort: { count: -1 } }
  ]);

  for (const burst of bursts) {
    alerts.push({
      type: 'scan_burst',
      severity: burst.count >= 50 ? 'critical' : 'high',
      title: 'Abnormal Scan Volume Detected',
      description: `Batch ${burst._id.batch} serial ${burst._id.serial} was scanned ${burst.count} times in the last 24 hours across ${burst.cities.filter(Boolean).length} location(s). This suggests mass QR code duplication.`,
      batch_id: burst._id.batch,
      serial_number: burst._id.serial,
      scan_count: burst.count,
      cities: burst.cities.filter(Boolean),
      detected_at: new Date(),
    });
  }

  return alerts;
}

/**
 * Rule 3: Geographic Dispersion
 * A batch authorized for one region showing up in 3+ different regions
 */
async function detectGeographicDispersion() {
  const alerts = [];

  const dispersed = await ScanLog.aggregate([
    { $match: { location_city: { $ne: null }, medicine_id: { $ne: null } } },
    {
      $group: {
        _id: '$medicine_id',
        cities: { $addToSet: '$location_city' },
        count: { $sum: 1 },
        batch_id: { $first: '$scanned_batch_id' },
      }
    },
    { $match: { $expr: { $gte: [{ $size: '$cities' }, 3] } } }
  ]);

  for (const item of dispersed) {
    // Look up the medicine to check authorized region
    const medicine = await Medicine.findById(item._id);
    if (medicine) {
      alerts.push({
        type: 'geographic_dispersion',
        severity: 'medium',
        title: 'Widespread Geographic Distribution',
        description: `${medicine.name} (Batch: ${item.batch_id}) authorized for ${medicine.authorized_region} has been scanned in ${item.cities.length} different locations: ${item.cities.join(', ')}. This may indicate supply chain diversion.`,
        batch_id: item.batch_id,
        medicine_name: medicine.name,
        authorized_region: medicine.authorized_region,
        scan_cities: item.cities,
        detected_at: new Date(),
      });
    }
  }

  return alerts;
}

/**
 * Rule 4: Low Score Pattern
 * Multiple scans for a batch consistently scoring below 50
 */
async function detectLowScorePatterns() {
  const alerts = [];

  const lowScores = await ScanLog.aggregate([
    { $match: { result_score: { $lt: 50, $ne: null } } },
    {
      $group: {
        _id: '$scanned_batch_id',
        avg_score: { $avg: '$result_score' },
        count: { $sum: 1 },
        serial: { $first: '$scanned_serial_number' },
      }
    },
    { $match: { count: { $gte: 2 } } },
    { $sort: { avg_score: 1 } }
  ]);

  for (const item of lowScores) {
    alerts.push({
      type: 'low_score_pattern',
      severity: item.avg_score < 20 ? 'critical' : 'high',
      title: 'Repeated Low Trust Scores',
      description: `Batch ${item._id} has ${item.count} scans with an average trust score of ${Math.round(item.avg_score)}/100. This batch is likely counterfeit and should be investigated.`,
      batch_id: item._id,
      average_score: Math.round(item.avg_score),
      scan_count: item.count,
      detected_at: new Date(),
    });
  }

  return alerts;
}

/**
 * Check anomalies for a specific medicine after a scan
 * Used inline during verification to add warnings
 */
export async function checkMedicineAnomalies(medicineId, batchId) {
  await connectDB();
  const warnings = [];

  // Check total scan count for this specific serial
  const totalScans = await ScanLog.countDocuments({ medicine_id: medicineId });
  if (totalScans > 10) {
    warnings.push({
      type: 'high_scan_count',
      message: `This serial has been scanned ${totalScans} times total — possible cloning.`,
    });
  }

  // Check for scans in multiple cities
  const cityCount = await ScanLog.distinct('location_city', { medicine_id: medicineId });
  if (cityCount.length > 3) {
    warnings.push({
      type: 'multi_city',
      message: `Scanned in ${cityCount.length} different cities — possible diversion.`,
    });
  }

  return warnings;
}
