import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import Manufacturer from '@/models/Manufacturer';
import { authenticate } from '@/middleware/auth';
import { generateHash, generateRSAKeyPair, signWithRSA } from '@/lib/crypto';
import QRCode from 'qrcode';

/**
 * POST /api/dashboard/generate-qr
 *
 * Creates a new Medicine in MongoDB and generates a signed QR code PNG.
 * Uses existing generateHash (HMAC) for new medicines by default.
 * If the manufacturer has a public_key (RSA mode), signs with RSA instead.
 *
 * Returns: { qrDataUrl, medicineId, batch_id, serial_number, hash, signature? }
 */
export async function POST(request) {
  try {
    await connectDB();

    // Auth: only manufacturer role
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (auth.role !== 'manufacturer' && auth.role !== 'regulator') {
      return NextResponse.json({ error: 'Only manufacturers can generate QR codes' }, { status: 403 });
    }

    const {
      name, batch_id, serial_number, authorized_region,
      exp_date, mfg_date, category, strength, dosage,
      instructions, side_effects,
    } = await request.json();

    if (!name || !batch_id || !serial_number || !authorized_region || !exp_date || !mfg_date) {
      return NextResponse.json({ error: 'name, batch_id, serial_number, authorized_region, mfg_date, exp_date are required' }, { status: 400 });
    }

    // Find manufacturer linked to this user
    let manufacturer = null;
    if (auth.user.manufacturer_id) {
      manufacturer = await Manufacturer.findById(auth.user.manufacturer_id);
    }

    // If the user registered via Google SSO and doesn't have a manufacturer profile yet, create one
    if (!manufacturer) {
      manufacturer = await Manufacturer.create({
        name: auth.user.organization || auth.user.name || 'Unknown Manufacturer',
        country: 'Global',
        secret_key: crypto.randomBytes(16).toString('hex'),
      });
      // Link it to the user profile permanently
      import('@/models/User').then(async ({ default: User }) => {
        await User.findByIdAndUpdate(auth.user._id, { manufacturer_id: manufacturer._id });
      });
    }

    let qrPayload;
    let hash = '';
    let signature = '';

    if (manufacturer?.public_key) {
      // RSA mode: sign with manufacturer's (conceptual) private key
      // In production you'd store the private key securely per manufacturer
      // For demo: re-derive a deterministic RSA pair from the manufacturer's secret_key
      // (This is a demo approximation — in real prod, store actual private key in HSM)
      const sigData = `${batch_id}:${serial_number}`;
      // Use HMAC hash as the "hash" field, RSA signature as "signature"
      hash = generateHash(batch_id, serial_number);
      // For demo: generate a fresh keypair and store public key if not already set
      const { publicKey, privateKey } = generateRSAKeyPair();
      signature = signWithRSA(sigData, privateKey);
      // Update manufacturer's public_key if this is first RSA QR
      if (!manufacturer.public_key) {
        manufacturer.public_key = publicKey;
        await manufacturer.save();
      }
      qrPayload = { batch_id, serial_number, hash, signature };
    } else {
      // HMAC mode (default for existing manufacturers without RSA setup)
      hash = generateHash(batch_id, serial_number);
      qrPayload = { batch_id, serial_number, hash };
    }

    // Check for duplicate batch + serial
    const existing = await Medicine.findOne({ batch_id, serial_number });
    if (existing) {
      return NextResponse.json({ error: 'A medicine with this batch_id and serial_number already exists' }, { status: 409 });
    }

    // Create Medicine document
    const medicine = await Medicine.create({
      name,
      manufacturer_id: manufacturer?._id || null,
      batch_id,
      serial_number,
      hash,
      mfg_date: new Date(mfg_date),
      exp_date: new Date(exp_date),
      authorized_region,
      category: category || '',
      strength: strength || '',
      dosage: dosage || '',
      instructions: instructions || '',
      side_effects: side_effects ? (Array.isArray(side_effects) ? side_effects : side_effects.split(',').map(s => s.trim())) : [],
      is_genuine: true,
      recalled: false,
    });

    // Generate QR code as data URL (PNG)
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), {
      width: 300,
      margin: 2,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    });

    return NextResponse.json({
      success: true,
      medicineId: medicine._id,
      batch_id,
      serial_number,
      hash,
      ...(signature ? { signature } : {}),
      cryptoMode: signature ? 'RSA-SHA256' : 'HMAC-SHA256',
      qrDataUrl,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in /api/dashboard/generate-qr:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
