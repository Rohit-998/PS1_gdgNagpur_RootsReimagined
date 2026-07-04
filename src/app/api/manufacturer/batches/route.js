import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import Manufacturer from '@/models/Manufacturer';
import ScanLog from '@/models/ScanLog';

// GET /api/manufacturer/batches — List all batches for a manufacturer
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const manufacturerName = searchParams.get('name');

    if (!manufacturerName) {
      return NextResponse.json({ error: 'Manufacturer name is required (use ?name=)' }, { status: 400 });
    }

    const manufacturer = await Manufacturer.findOne({
      name: { $regex: new RegExp(manufacturerName, 'i') }
    });

    if (!manufacturer) {
      return NextResponse.json({ error: 'Manufacturer not found' }, { status: 404 });
    }

    // Get all medicines for this manufacturer
    const medicines = await Medicine.find({ manufacturer_id: manufacturer._id })
      .sort({ createdAt: -1 })
      .lean();

    // Get scan stats for each medicine
    const batchesWithStats = await Promise.all(medicines.map(async (med) => {
      const scanCount = await ScanLog.countDocuments({ medicine_id: med._id });
      const avgScore = await ScanLog.aggregate([
        { $match: { medicine_id: med._id, result_score: { $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$result_score' } } }
      ]);

      return {
        id: med._id,
        name: med.name,
        batch_id: med.batch_id,
        serial_number: med.serial_number,
        mfg_date: med.mfg_date,
        exp_date: med.exp_date,
        authorized_region: med.authorized_region,
        is_expired: new Date() > med.exp_date,
        recalled: med.recalled,
        recall_reason: med.recall_reason,
        scan_stats: {
          total_scans: scanCount,
          average_score: avgScore[0]?.avg ? Math.round(avgScore[0].avg) : null,
        },
      };
    }));

    return NextResponse.json({
      manufacturer: {
        name: manufacturer.name,
        country: manufacturer.country,
        verified: manufacturer.verified,
      },
      batches: batchesWithStats,
      total: batchesWithStats.length,
      active: batchesWithStats.filter(b => !b.is_expired && !b.recalled).length,
      recalled: batchesWithStats.filter(b => b.recalled).length,
      expired: batchesWithStats.filter(b => b.is_expired).length,
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching batches:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
