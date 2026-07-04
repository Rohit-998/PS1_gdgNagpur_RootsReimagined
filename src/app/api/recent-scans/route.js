import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ScanLog from '@/models/ScanLog';
import Medicine from '@/models/Medicine';

export async function GET() {
  try {
    await connectDB();

    const recentScans = await ScanLog.find({})
      .sort({ scanned_at: -1, createdAt: -1 })
      .limit(5)
      .populate('medicine_id', 'name batch_id serial_number')
      .lean();

    const formatted = recentScans.map(scan => ({
      id: scan._id,
      medicineName: scan.medicine_id?.name || 'Unknown Medicine',
      batchId: scan.scanned_batch_id || scan.medicine_id?.batch_id,
      serialNumber: scan.scanned_serial_number || scan.medicine_id?.serial_number,
      score: scan.result_score,
      city: scan.location_city || 'Unknown',
      scannedAt: scan.scanned_at || scan.createdAt,
    }));

    return NextResponse.json({ scans: formatted }, { status: 200 });
  } catch (error) {
    console.error("Error fetching recent scans:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
