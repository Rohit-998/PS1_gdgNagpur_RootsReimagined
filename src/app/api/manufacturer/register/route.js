import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import Manufacturer from '@/models/Manufacturer';
import { generateHash } from '@/lib/crypto';

// POST /api/manufacturer/register — Register a new medicine batch
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      manufacturer_name,
      medicine_name,
      batch_id,
      serial_number,
      mfg_date,
      exp_date,
      authorized_region,
      category,
      strength,
      dosage,
      side_effects,
      instructions,
      alternatives,
      drug_interactions,
      api_key,
    } = body;

    // Validate required fields
    if (!manufacturer_name || !medicine_name || !batch_id || !serial_number || !mfg_date || !exp_date || !authorized_region) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: ['manufacturer_name', 'medicine_name', 'batch_id', 'serial_number', 'mfg_date', 'exp_date', 'authorized_region']
      }, { status: 400 });
    }

    // Find or create manufacturer
    let manufacturer = await Manufacturer.findOne({ name: manufacturer_name });
    if (!manufacturer) {
      manufacturer = await Manufacturer.create({
        name: manufacturer_name,
        country: body.country || 'Unknown',
        verified: false,
        secret_key: process.env.MEDIGUARD_SECRET_KEY || 'mediguard_demo_secret_2024',
      });
    }

    // Generate cryptographic hash
    const hash = generateHash(batch_id, serial_number);

    // Check for duplicate
    const existing = await Medicine.findOne({ batch_id, serial_number });
    if (existing) {
      return NextResponse.json({ error: 'Medicine with this batch_id and serial_number already exists' }, { status: 409 });
    }

    // Create medicine
    const medicine = await Medicine.create({
      name: medicine_name,
      manufacturer_id: manufacturer._id,
      batch_id,
      serial_number,
      hash,
      mfg_date: new Date(mfg_date),
      exp_date: new Date(exp_date),
      is_genuine: true,
      authorized_region,
      category,
      strength,
      dosage,
      side_effects: side_effects || [],
      instructions,
      alternatives: alternatives || [],
      drug_interactions: drug_interactions || [],
    });

    return NextResponse.json({
      success: true,
      message: 'Medicine registered successfully',
      medicine: {
        id: medicine._id,
        name: medicine.name,
        batch_id: medicine.batch_id,
        serial_number: medicine.serial_number,
        hash: medicine.hash,
        manufacturer: manufacturer.name,
      },
      qr_data: {
        batch_id: medicine.batch_id,
        serial_number: medicine.serial_number,
        hash: medicine.hash,
      },
    }, { status: 201 });

  } catch (error) {
    console.error("Error registering medicine:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
