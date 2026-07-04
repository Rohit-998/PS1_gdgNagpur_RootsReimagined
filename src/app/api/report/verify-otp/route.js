import { NextResponse } from 'next/server';
import { verifyOTP, maskPhone } from '@/lib/otpStore.js';
import connectDB from '@/lib/mongodb.js';
import Report from '@/models/Report.js';
import Pharmacy from '@/models/Pharmacy.js';

export async function POST(request) {
  try {
    const { phone, otp, reportData } = await request.json();
    // reportData: { batch_id, serial_number, medicine_id, verdict, trust_score, pharmacy_name, location }

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }

    const normalised = phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`;

    // Verify OTP
    const { valid, reason } = verifyOTP(normalised, otp);
    if (!valid) {
      return NextResponse.json({ error: reason }, { status: 400 });
    }

    await connectDB();

    // Save report
    const report = await Report.create({
      medicine_id:    reportData.medicine_id || null,
      batch_id:       reportData.batch_id,
      serial_number:  reportData.serial_number,
      reporter_phone: maskPhone(normalised),
      pharmacy_name:  reportData.pharmacy_name || 'Unknown',
      location:       reportData.location || 'Unknown',
      trust_score:    reportData.trust_score,
      verdict:        reportData.verdict,
    });

    // Lower pharmacy trust score if pharmacy name provided
    if (reportData.pharmacy_name) {
      await Pharmacy.findOneAndUpdate(
        { name: { $regex: reportData.pharmacy_name, $options: 'i' } },
        { $inc: { trust_score: -10, flagged_count: 1 } }
      );
    }

    return NextResponse.json({
      success: true,
      reportId: report._id,
      message: 'Report submitted successfully. Authorities have been notified.',
    });
  } catch (error) {
    console.error('Verify OTP & Report error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit report' }, { status: 500 });
  }
}
