import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ScanLog from '@/models/ScanLog';
import Report from '@/models/Report';
import Pharmacy from '@/models/Pharmacy';

export async function GET() {
  try {
    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalScans, todayScans, counterfeitsToday, totalCounterfeits, pharmaciesFlagged, recentScans] = await Promise.all([
      ScanLog.countDocuments(),
      ScanLog.countDocuments({ createdAt: { $gte: today } }),
      ScanLog.countDocuments({ verdict: 'counterfeit', createdAt: { $gte: today } }),
      ScanLog.countDocuments({ verdict: 'counterfeit' }),
      Pharmacy.countDocuments({ flagged_count: { $gt: 0 } }),
      ScanLog.find().sort({ createdAt: -1 }).limit(6).select('verdict location createdAt'),
    ]);

    return NextResponse.json({
      totalScans,
      todayScans,
      counterfeitsToday,
      totalCounterfeits,
      pharmaciesFlagged,
      recentScans,
    });
  } catch (err) {
    console.error('Stats error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
