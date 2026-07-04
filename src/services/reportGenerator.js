// Report Generation Service
// Creates structured counterfeit detection reports with unique IDs

import Report from '../models/Report.js';
import connectDB from '../lib/mongodb.js';
import crypto from 'crypto';

/**
 * Generate a unique report ID
 */
function generateReportId() {
  const date = new Date();
  const year = date.getFullYear();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `RPT-${year}-${random}`;
}

/**
 * Create a counterfeit detection report
 * @param {Object} verificationResult - Full verification result
 * @param {Object} scanLocation - { lat, lng, city, region }
 * @param {Object} options - { reported_by, reporter_role }
 */
export async function createReport(verificationResult, scanLocation = {}, options = {}) {
  await connectDB();

  const report = await Report.create({
    report_id: generateReportId(),
    medicine_id: verificationResult.medicineInfo?._id || null,
    batch_id: verificationResult.medicineInfo?.batch_id || verificationResult.qrData?.batch_id || 'Unknown',
    serial_number: verificationResult.medicineInfo?.serial_number || verificationResult.qrData?.serial_number || 'Unknown',
    total_score: verificationResult.totalScore,
    verdict: verificationResult.verdict,
    layer_results: verificationResult.results,
    ai_analysis: verificationResult.aiAnalysis?.analysis || null,
    scan_location: {
      lat: scanLocation.lat,
      lng: scanLocation.lng,
      city: scanLocation.city,
      region: scanLocation.region,
    },
    reported_by: options.reported_by || 'anonymous',
    reporter_role: options.reporter_role || 'consumer',
    medicine_name: verificationResult.medicineInfo?.name || 'Unknown',
    manufacturer_name: verificationResult.medicineInfo?.manufacturer || 'Unknown',
    status: 'open',
  });

  return report;
}

/**
 * Get all reports with optional filtering
 */
export async function getReports(filters = {}) {
  await connectDB();

  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.verdict) query.verdict = filters.verdict;
  if (filters.batch_id) query.batch_id = filters.batch_id;
  if (filters.region) query['scan_location.region'] = filters.region;

  const reports = await Report.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit || 50)
    .lean();

  return reports;
}

/**
 * Update report status
 */
export async function updateReportStatus(reportId, status, notes) {
  await connectDB();

  const report = await Report.findOneAndUpdate(
    { report_id: reportId },
    { status, notes },
    { new: true }
  );

  return report;
}

/**
 * Get report statistics
 */
export async function getReportStats() {
  await connectDB();

  const stats = await Report.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
        investigating: { $sum: { $cond: [{ $eq: ['$status', 'investigating'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        counterfeit: { $sum: { $cond: [{ $eq: ['$verdict', 'counterfeit'] }, 1, 0] } },
        suspicious: { $sum: { $cond: [{ $eq: ['$verdict', 'suspicious'] }, 1, 0] } },
      }
    }
  ]);

  return stats[0] || { total: 0, open: 0, investigating: 0, resolved: 0, counterfeit: 0, suspicious: 0 };
}
