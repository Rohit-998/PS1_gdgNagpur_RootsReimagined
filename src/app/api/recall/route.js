import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import Manufacturer from '@/models/Manufacturer';
import ScanLog from '@/models/ScanLog';
import { fireWebhooks } from '@/services/webhookService';

// POST /api/recall — Issue a batch recall
export async function POST(request) {
  try {
    await connectDB();
    const { batch_id, reason, api_key } = await request.json();

    if (!batch_id || !reason) {
      return NextResponse.json({ error: 'batch_id and reason are required' }, { status: 400 });
    }

    // Find all medicines with this batch_id
    const updateResult = await Medicine.updateMany(
      { batch_id },
      {
        recalled: true,
        recall_reason: reason,
        recall_date: new Date(),
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'No medicines found with this batch ID' }, { status: 404 });
    }

    // Find affected users (anyone who previously scanned this batch)
    const affectedScans = await ScanLog.countDocuments({ scanned_batch_id: batch_id });
    const affectedCities = await ScanLog.distinct('location_city', { scanned_batch_id: batch_id });

    // Fire recall webhooks
    fireWebhooks('recall_issued', {
      batch_id,
      reason,
      affected_scans: affectedScans,
      affected_cities: affectedCities.filter(Boolean),
      timestamp: new Date().toISOString(),
    }).catch(err => console.error("Webhook fire failed:", err.message));

    return NextResponse.json({
      success: true,
      message: `Recall issued for batch ${batch_id}`,
      medicines_affected: updateResult.modifiedCount,
      previous_scans_affected: affectedScans,
      affected_cities: affectedCities.filter(Boolean),
      recall_date: new Date(),
    }, { status: 200 });

  } catch (error) {
    console.error("Error issuing recall:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/recall — List all recalled batches
export async function GET(request) {
  try {
    await connectDB();

    const recalledMedicines = await Medicine.find({ recalled: true })
      .populate('manufacturer_id', 'name country')
      .select('name batch_id serial_number recall_reason recall_date authorized_region manufacturer_id')
      .sort({ recall_date: -1 })
      .lean();

    // Group by batch_id for cleaner output
    const recallMap = {};
    for (const med of recalledMedicines) {
      if (!recallMap[med.batch_id]) {
        recallMap[med.batch_id] = {
          batch_id: med.batch_id,
          medicine_name: med.name,
          manufacturer: med.manufacturer_id?.name,
          recall_reason: med.recall_reason,
          recall_date: med.recall_date,
          authorized_region: med.authorized_region,
          affected_serials: [],
        };
      }
      recallMap[med.batch_id].affected_serials.push(med.serial_number);
    }

    return NextResponse.json({
      recalls: Object.values(recallMap),
      total: Object.keys(recallMap).length,
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching recalls:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
