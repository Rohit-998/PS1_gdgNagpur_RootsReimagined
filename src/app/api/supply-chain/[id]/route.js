import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shipment from '@/models/Shipment';
import { authenticate } from '@/middleware/auth';
import { ownsShipment } from '@/lib/supplyChainAccess';

/**
 * GET /api/supply-chain/[id]
 * Get full shipment details including all checkpoints.
 */
export async function GET(request, { params }) {
  try {
    await connectDB();
    const auth = await authenticate(request);
    if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const shipment = await Shipment.findById(id).lean();
    if (!shipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    if (!ownsShipment(auth, shipment)) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    return NextResponse.json({ shipment });
  } catch (error) {
    console.error('GET /api/supply-chain/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PUT /api/supply-chain/[id]
 * Update shipment: checkpoints, ETAs, status, etc.
 */
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const auth = await authenticate(request);
    if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (auth.role !== 'manufacturer' && auth.role !== 'regulator') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { checkpoints, estimated_delivery, status: newStatus } = body;

    const shipment = await Shipment.findById(id);
    if (!shipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    if (!ownsShipment(auth, shipment)) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    if (checkpoints && Array.isArray(checkpoints)) {
      // Re-order and validate
      const ordered = checkpoints.map((cp, i) => ({
        ...cp,
        order: i,
      }));
      shipment.checkpoints = ordered;
    }
    if (estimated_delivery) shipment.estimated_delivery = new Date(estimated_delivery);
    if (newStatus) shipment.status = newStatus;

    await shipment.save();
    return NextResponse.json({ shipment: shipment.toObject() });
  } catch (error) {
    console.error('PUT /api/supply-chain/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/supply-chain/[id]
 * Cancel a shipment (soft delete — sets status to 'cancelled').
 */
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const auth = await authenticate(request);
    if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (auth.role !== 'manufacturer' && auth.role !== 'regulator') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const shipment = await Shipment.findById(id);
    if (!shipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    if (!ownsShipment(auth, shipment)) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    shipment.status = 'cancelled';
    await shipment.save();

    return NextResponse.json({ success: true, shipment: shipment.toObject() });
  } catch (error) {
    console.error('DELETE /api/supply-chain/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
