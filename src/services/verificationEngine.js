/**
 * SafeDose Verification Engine
 * Multi-layer pharmaceutical verification: batch, crypto, clone detection,
 * geographic, temporal, supply chain, recall check, and AI analysis.
 */
import Medicine from '../models/Medicine.js';
import Manufacturer from '../models/Manufacturer.js';
import ScanLog from '../models/ScanLog.js';
import SupplyChainEvent from '../models/SupplyChainEvent.js';
import { verifyHash, verifyChain, verifyWithRSA } from '../lib/crypto.js';
import connectDB from '../lib/mongodb.js';
import { generateAIAnalysis } from './aiAnalysis.js';
import { fireWebhooks } from './webhookService.js';

/**
 * @param {Object} qrData - { batch_id, serial_number, hash, signature? }
 * @param {Object} userLocation - { lat, lng, region, city? }
 * @param {Object} scannerCtx - { userId?, userRole?, deviceId? }
 */
export async function verifyMedicine(qrData, userLocation, scannerCtx = {}) {
  await connectDB();

  const { batch_id, serial_number, hash } = qrData;
  const results = {};
  let totalScore = 0;

  // Layer 1: Batch Existence Check (30 pts)
  const medicine = await Medicine.findOne({ batch_id, serial_number }).populate('manufacturer_id');
  results.batchCheck = {
    passed: !!medicine,
    score: medicine ? 30 : 0,
    message: medicine ? "Batch found in manufacturer database" : "Batch number or serial not found"
  };
  totalScore += results.batchCheck.score;

  // Layer 2: Crypto Hash Check (25 pts) — dual-mode: RSA or HMAC
  if (medicine) {
    let hashValid = false;
    let cryptoMode = 'HMAC-SHA256';

    if (qrData.isManual) {
      // Manual entry bypass
      results.hashCheck = {
        passed: true,
        score: 25,
        cryptoMode: 'Manual Entry',
        message: 'Manual entry bypasses cryptographic signature'
      };
      totalScore += 25;
    } else {
      const manufacturer = medicine.manufacturer_id;
      if (manufacturer?.public_key && qrData.signature) {
        // New RSA mode: verify digital signature against manufacturer public key
        const sigData = `${batch_id}:${serial_number}`;
        hashValid = verifyWithRSA(sigData, manufacturer.public_key, qrData.signature);
        cryptoMode = 'RSA-SHA256';
      } else {
        // Legacy HMAC mode: compare stored hash
        const expectedHash = medicine.hash;
        hashValid = expectedHash === hash;
      }

      results.hashCheck = {
        passed: hashValid,
        score: hashValid ? 25 : 0,
        cryptoMode,
        message: hashValid
          ? `Cryptographic signature verified (${cryptoMode})`
          : 'Hash mismatch — possible tampering',
      };
      totalScore += results.hashCheck.score;
    }
  } else {
    results.hashCheck = { passed: false, score: 0, message: 'Cannot verify hash without valid batch' };
  }

  // Layer 3: Scan Frequency Analysis (20 pts) — user-aware clone detection
  const { userId = null, userRole = 'anonymous', deviceId = null } = scannerCtx;

  if (userRole === 'pharmacy') {
    // Pharmacy bypass: inventory checks do NOT penalise clone detection
    results.scanFrequency = {
      passed: true,
      score: 20,
      scanCount: 0,
      message: 'Pharmacy inventory check — clone score not penalised',
    };
    totalScore += 20;
  } else {
    // Consumer/anonymous: count scans by OTHER users/devices only
    // Same user rescanning their own medicine is completely normal
    const otherScanQuery = {
      scanned_batch_id: batch_id,
      scanned_serial_number: serial_number,
      ...(userId ? { user_id: { $ne: userId } } : {}),
    };
    let otherScanCount = 0;
    if (medicine) {
      otherScanCount = await ScanLog.countDocuments({
        medicine_id: medicine._id,
        ...(userId ? { user_id: { $ne: userId } } : {}),
      });
    } else {
      otherScanCount = await ScanLog.countDocuments(otherScanQuery);
    }

    const scanScore = otherScanCount <= 2 ? 20
      : otherScanCount <= 5 ? 10
      : otherScanCount <= 50 ? 5 : 0;

    results.scanFrequency = {
      passed: otherScanCount <= 2,
      score: scanScore,
      scanCount: otherScanCount,
      message: otherScanCount <= 2
        ? `Scanned ${otherScanCount} time(s) by others — normal`
        : `Scanned ${otherScanCount} times by different users — likely cloned QR`,
    };
    totalScore += scanScore;
  }

  // Layer 4: Geographic Verification (10 pts)
  if (medicine && userLocation) {
    const geoMatch = userLocation.region && medicine.authorized_region.toLowerCase().includes(userLocation.region.toLowerCase());
    results.geoCheck = {
      passed: geoMatch,
      score: geoMatch ? 10 : 0,
      message: geoMatch 
        ? "Location matches authorized distribution region" 
        : `This batch is authorized for ${medicine.authorized_region}, not your current region`
    };
    totalScore += results.geoCheck.score;
  } else {
    results.geoCheck = { passed: false, score: 0, message: "Geographic data missing" };
  }

  // Layer 5: Temporal Validation (10 pts)
  if (medicine) {
    const now = new Date();
    const isExpired = now > medicine.exp_date;
    const isFutureMfg = now < medicine.mfg_date;
    const datesValid = !isExpired && !isFutureMfg;
    
    results.temporalCheck = {
      passed: datesValid,
      score: datesValid ? 10 : 0,
      message: datesValid ? "Manufacturing and expiry dates are valid" : (isExpired ? "Medicine is expired" : "Invalid manufacturing date (in future)")
    };
    totalScore += results.temporalCheck.score;
  } else {
    results.temporalCheck = { passed: false, score: 0, message: "Cannot validate dates without batch record" };
  }

  // Layer 6: Supply Chain Integrity (5 pts)
  if (medicine) {
    const events = await SupplyChainEvent.find({ medicine_id: medicine._id }).sort({ timestamp: 1 });
    const { valid } = verifyChain(events);

    results.supplyChain = {
      passed: valid,
      score: valid ? 5 : 0,
      eventsCount: events.length,
      events: events.map(e => ({
        type: e.event_type,
        location: e.location,
        timestamp: e.timestamp,
      })),
      message: valid ? "Supply chain complete — all nodes verified" : "Supply chain broken or missing nodes"
    };
    totalScore += results.supplyChain.score;
  } else {
    results.supplyChain = { passed: false, score: 0, message: "No supply chain data available" };
  }

  // Layer 7: Batch Recall Check (instant fail override)
  if (medicine && medicine.recalled) {
    results.recallCheck = {
      passed: false,
      score: 0,
      recall_reason: medicine.recall_reason || 'No reason provided',
      recall_date: medicine.recall_date,
      message: `RECALLED: ${medicine.recall_reason || 'This batch has been recalled by the manufacturer'}`
    };
    // Force verdict to counterfeit if recalled
    totalScore = Math.min(totalScore, 30); // Cap score at 30 for recalled medicines
  } else {
    results.recallCheck = {
      passed: true,
      score: 0, // No points, just a pass/fail gate
      message: "No active recalls for this batch"
    };
  }

  // Log this scan
  try {
    await ScanLog.create({
      medicine_id: medicine ? medicine._id : null,
      scanned_batch_id: batch_id,
      scanned_serial_number: serial_number,
      location_lat: userLocation?.lat,
      location_lng: userLocation?.lng,
      location_city: userLocation?.city || userLocation?.region,
      result_score: totalScore,
      // New identity fields
      user_id: userId || null,
      device_id: deviceId || null,
      scan_type: userRole === 'pharmacy' ? 'inventory_check' : 'consumer',
    });
  } catch (error) {
    console.error("Failed to log scan", error);
  }

  // Determine verdict
  const verdict = medicine?.recalled 
    ? "counterfeit" 
    : totalScore >= 80 ? "verified" : totalScore >= 40 ? "suspicious" : "counterfeit";

  // Build base result
  const verificationResult = {
    medicineInfo: medicine ? {
      _id: medicine._id,
      name: medicine.name,
      manufacturer: medicine.manufacturer_id?.name,
      batch_id: medicine.batch_id,
      serial_number: medicine.serial_number,
      mfg_date: medicine.mfg_date,
      exp_date: medicine.exp_date,
      category: medicine.category,
      strength: medicine.strength,
      dosage: medicine.dosage,
      instructions: medicine.instructions,
      side_effects: medicine.side_effects,
      drug_interactions: medicine.drug_interactions,
      authorized_region: medicine.authorized_region,
      recalled: medicine.recalled,
    } : null,
    results,
    totalScore,
    verdict,
    qrData: { batch_id, serial_number },
    userLocation,
  };

  // Layer 8: AI Analysis (async, non-blocking for score)
  try {
    const aiAnalysis = await generateAIAnalysis(verificationResult);
    verificationResult.aiAnalysis = aiAnalysis;
  } catch (error) {
    console.error("AI Analysis failed:", error.message);
    verificationResult.aiAnalysis = { analysis: "AI analysis unavailable", source: "error" };
  }

  // Fire webhooks for counterfeit/suspicious results (async, don't block response)
  if (verdict === 'counterfeit' || verdict === 'suspicious') {
    fireWebhooks('counterfeit_detected', {
      medicine_name: medicine?.name || 'Unknown',
      batch_id,
      serial_number,
      score: totalScore,
      verdict,
      location: userLocation,
      region: userLocation?.region || medicine?.authorized_region,
      timestamp: new Date().toISOString(),
    }).catch(err => console.error("Webhook fire failed:", err.message));
  }

  return verificationResult;
}
