import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb.js';
import Pharmacy from '@/models/Pharmacy.js';

export async function GET() {
  try {
    await connectDB();
    const pharmacies = await Pharmacy.find().sort({ trust_score: -1 }).limit(20);
    return NextResponse.json({ pharmacies });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
