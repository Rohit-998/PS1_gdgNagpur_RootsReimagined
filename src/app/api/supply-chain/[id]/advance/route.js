import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shipment from '@/models/Shipment';
import { authenticate } from '@/middleware/auth';
import { ownsShipment } from '@/lib/supplyChainAccess';

/**
 * POST /api/supply-chain/[id]/advance
 * Advance shipment to the next checkpoint.
 * Sets actual_arrival on the current checkpoint and moves pointer forward.
 * Body (optional): { notes, delay }
 */
export async function POST(request, { params }) {
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

    if (shipment.status === 'delivered' || shipment.status === 'cancelled') {
      return NextResponse.json({ error: 'Shipment already completed or cancelled' }, { status: 400 });
    }

    let body = {};
    try { body = await request.json(); } catch { /* no body is fine */ }

    const currentIdx = shipment.current_checkpoint_index;
    const totalCheckpoints = shipment.checkpoints.length;

    if (currentIdx >= totalCheckpoints) {
      return NextResponse.json({ error: 'All checkpoints already reached' }, { status: 400 });
    }

    // Mark current checkpoint as completed
    shipment.checkpoints[currentIdx].status = 'completed';
    shipment.checkpoints[currentIdx].actual_arrival = new Date();
    if (body.notes) shipment.checkpoints[currentIdx].notes = body.notes;

    // Set departure time on previously completed checkpoint
    if (currentIdx > 0) {
      shipment.checkpoints[currentIdx - 1].departure_time = new Date();
    }

    const nextIdx = currentIdx + 1;

    if (nextIdx >= totalCheckpoints) {
      // All checkpoints completed — shipment delivered
      shipment.status = 'delivered';
      shipment.actual_delivery = new Date();
      shipment.current_checkpoint_index = totalCheckpoints;
    } else {
      // Move to next checkpoint
      shipment.checkpoints[nextIdx].status = 'current';
      shipment.current_checkpoint_index = nextIdx;

      // Update overall shipment status
      if (nextIdx === totalCheckpoints - 1) {
        shipment.status = 'out_for_delivery';
      } else {
        shipment.status = body.delay ? 'delayed' : 'in_transit';
      }
    }

    await shipment.save();

    return NextResponse.json({ shipment: shipment.toObject() });
  } catch (error) {
    console.error('POST /api/supply-chain/[id]/advance error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
