import { NextResponse } from 'next/server';
import { verifyMedicine } from '@/services/verificationEngine';
import { verifyToken } from '@/middleware/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { qrData, userLocation } = body;

    if (!qrData || !qrData.batch_id || !qrData.serial_number) {
      return NextResponse.json({ error: 'Invalid QR Data provided' }, { status: 400 });
    }

    // Extract scanner identity from existing Bearer token (same system as middleware/auth.js)
    let userId = null;
    let userRole = 'anonymous';
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.slice(7));
      if (decoded) {
        userId = decoded.userId;
        userRole = decoded.role;
      }
    }

    // Device fingerprint fallback for anonymous users (used in clone detection grouping)
    const deviceId =
      request.headers.get('x-device-id') ||
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'anonymous';

    const scannerCtx = { userId, userRole, deviceId };

    const verificationResult = await verifyMedicine(qrData, userLocation, scannerCtx);

    return NextResponse.json(verificationResult, { status: 200 });
  } catch (error) {
    console.error('Error in verification API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
