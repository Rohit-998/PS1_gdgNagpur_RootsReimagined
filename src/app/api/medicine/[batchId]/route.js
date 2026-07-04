import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import Manufacturer from '@/models/Manufacturer';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { batchId } = await params;

    const medicine = await Medicine.findOne({ batch_id: batchId }).populate('manufacturer_id', 'name country verified');

    if (!medicine) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
    }

    return NextResponse.json({
      name: medicine.name,
      manufacturer: {
        name: medicine.manufacturer_id?.name,
        country: medicine.manufacturer_id?.country,
        verified: medicine.manufacturer_id?.verified,
      },
      batch_id: medicine.batch_id,
      serial_number: medicine.serial_number,
      category: medicine.category,
      strength: medicine.strength,
      mfg_date: medicine.mfg_date,
      exp_date: medicine.exp_date,
      authorized_region: medicine.authorized_region,
      // Drug information
      dosage: medicine.dosage,
      side_effects: medicine.side_effects,
      instructions: medicine.instructions,
      alternatives: medicine.alternatives,
      drug_interactions: medicine.drug_interactions,
      // Recall status
      recalled: medicine.recalled,
      recall_reason: medicine.recall_reason,
      recall_date: medicine.recall_date,
      // Status
      is_expired: new Date() > medicine.exp_date,
      days_until_expiry: Math.ceil((medicine.exp_date - new Date()) / (1000 * 60 * 60 * 24)),
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching medicine info:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
