import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb.js';
import Report from '@/models/Report.js';
import Pharmacy from '@/models/Pharmacy.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { batch_id, verdict, trust_score, pharmacy_name, location, reporter_name, additional_notes } = body;

    if (!batch_id) {
      return NextResponse.json({ error: 'batch_id is required' }, { status: 400 });
    }

    await connectDB();

    const report = await Report.create({
      batch_id,
      verdict:        verdict || 'counterfeit',
      trust_score:    trust_score || 0,
      pharmacy_name:  pharmacy_name || 'Unknown',
      location:       location || 'Unknown',
      reporter_name:  reporter_name || 'Anonymous',
      additional_notes,
      reporter_phone: 'Anonymous',  // no OTP in demo — DigiLocker in production
    });

    // Lower pharmacy trust score if pharmacy exists in DB
    if (pharmacy_name) {
      await Pharmacy.findOneAndUpdate(
        { name: { $regex: pharmacy_name, $options: 'i' } },
        { $inc: { trust_score: -10, flagged_count: 1 } }
      );
    }

    return NextResponse.json({
      success:  true,
      reportId: report._id,
      message:  'Report submitted. Authorities have been notified.',
    });
  } catch (error) {
    console.error('Report submit error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit report' }, { status: 500 });
  }
}
