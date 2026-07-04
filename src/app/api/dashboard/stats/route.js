import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ScanLog from '@/models/ScanLog';
import Medicine from '@/models/Medicine';
import { authenticate } from '@/middleware/auth';

/**
 * GET /api/dashboard/stats?role=consumer|pharmacy|manufacturer
 *
 * Returns aggregated stats for the authenticated user's role dashboard.
 * Uses the existing Bearer token auth system — no new credentials.
 */
export async function GET(request) {
  try {
    await connectDB();

    // Authenticate using existing middleware
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { user, role } = auth;
    const url = new URL(request.url);
    const requestedRole = url.searchParams.get('role') || role;

    // --- Consumer stats ---
    if (requestedRole === 'consumer') {
      const recentScans = await ScanLog.find({ user_id: user._id.toString() })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('medicine_id', 'name batch_id serial_number')
        .lean();

      const verdictCounts = { verified: 0, suspicious: 0, counterfeit: 0 };
      recentScans.forEach(s => {
        const score = s.result_score || 0;
        if (score >= 80) verdictCounts.verified++;
        else if (score >= 40) verdictCounts.suspicious++;
        else verdictCounts.counterfeit++;
      });

      return NextResponse.json({
        role: 'consumer',
        totalScans: recentScans.length,
        verdictCounts,
        recentScans: recentScans.map(s => ({
          id: s._id,
          medicineName: s.medicine_id?.name || 'Unknown',
          batchId: s.scanned_batch_id,
          score: s.result_score,
          city: s.location_city,
          scannedAt: s.scanned_at || s.createdAt,
          verdict: s.result_score >= 80 ? 'verified' : s.result_score >= 40 ? 'suspicious' : 'counterfeit',
        })),
      });
    }

    // --- Pharmacy stats ---
    if (requestedRole === 'pharmacy') {
      // All scans for this pharmacy user
      const allScans = await ScanLog.find({ user_id: user._id.toString() })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('medicine_id', 'name batch_id serial_number category')
        .lean();

      const consumerScans = allScans.filter(s => s.scan_type !== 'inventory_check');
      const inventoryScans = allScans.filter(s => s.scan_type === 'inventory_check');
      const counterfeitAlerts = allScans.filter(s => (s.result_score || 0) < 40);
      const verifiedCount = allScans.filter(s => (s.result_score || 0) >= 80).length;
      const trustPct = allScans.length > 0 ? Math.round((verifiedCount / allScans.length) * 100) : 100;

      return NextResponse.json({
        role: 'pharmacy',
        totalScans: allScans.length,
        inventoryChecks: inventoryScans.length,
        trustPct,
        isTrustedPharmacy: trustPct >= 80,
        counterfeitAlerts: counterfeitAlerts.map(s => ({
          id: s._id,
          medicineName: s.medicine_id?.name || 'Unknown',
          batchId: s.scanned_batch_id,
          score: s.result_score,
          scannedAt: s.scanned_at || s.createdAt,
        })),
        recentScans: allScans.slice(0, 20).map(s => ({
          id: s._id,
          medicineName: s.medicine_id?.name || 'Unknown',
          batchId: s.scanned_batch_id,
          score: s.result_score,
          scanType: s.scan_type,
          city: s.location_city,
          scannedAt: s.scanned_at || s.createdAt,
          verdict: s.result_score >= 80 ? 'verified' : s.result_score >= 40 ? 'suspicious' : 'counterfeit',
        })),
      });
    }

    // --- Manufacturer / Regulator stats ---
    if (requestedRole === 'manufacturer' || requestedRole === 'regulator') {
      // Find medicines belonging to this manufacturer
      const manufacturerId = user.manufacturer_id;
      const medicineQuery = manufacturerId ? { manufacturer_id: manufacturerId } : {};
      const medicines = await Medicine.find(medicineQuery).select('_id name batch_id recalled').lean();
      const medicineIds = medicines.map(m => m._id);

      const allScans = await ScanLog.find({ medicine_id: { $in: medicineIds } })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      const scanLocations = allScans
        .filter(s => s.location_lat && s.location_lng)
        .map(s => ({
          lat: s.location_lat,
          lng: s.location_lng,
          city: s.location_city,
          score: s.result_score,
          verdict: s.result_score >= 80 ? 'verified' : s.result_score >= 40 ? 'suspicious' : 'counterfeit',
        }));

      const recalledBatches = medicines.filter(m => m.recalled);
      const verdictCounts = { verified: 0, suspicious: 0, counterfeit: 0 };
      allScans.forEach(s => {
        const score = s.result_score || 0;
        if (score >= 80) verdictCounts.verified++;
        else if (score >= 40) verdictCounts.suspicious++;
        else verdictCounts.counterfeit++;
      });

      return NextResponse.json({
        role: requestedRole,
        totalMedicines: medicines.length,
        totalScans: allScans.length,
        verdictCounts,
        recalledBatches: recalledBatches.map(m => ({ id: m._id, name: m.name, batch_id: m.batch_id })),
        scanLocations,
        recentScans: allScans.slice(0, 20).map(s => ({
          id: s._id,
          batchId: s.scanned_batch_id,
          score: s.result_score,
          city: s.location_city,
          scannedAt: s.scanned_at || s.createdAt,
          verdict: s.result_score >= 80 ? 'verified' : s.result_score >= 40 ? 'suspicious' : 'counterfeit',
        })),
      });
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  } catch (error) {
    console.error('Error in /api/dashboard/stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
