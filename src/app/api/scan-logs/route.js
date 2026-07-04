import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ScanLog from '@/models/ScanLog';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { medicine_id, batch_id, serial_number, location, result_score } = body;

    const scanLog = await ScanLog.create({
      medicine_id: medicine_id || null,
      scanned_batch_id: batch_id,
      scanned_serial_number: serial_number,
      location_lat: location?.lat,
      location_lng: location?.lng,
      location_city: location?.city || location?.region,
      result_score: result_score,
    });

    return NextResponse.json({ success: true, scanLog }, { status: 201 });
  } catch (error) {
    console.error("Error creating scan log:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
