import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shipment from '@/models/Shipment';
import Medicine from '@/models/Medicine';
import { authenticate } from '@/middleware/auth';
import { manufacturerScope } from '@/lib/supplyChainAccess';

/**
 * GET /api/supply-chain
 * List shipments for the authenticated manufacturer.
 * Query params: status, batch_id, medicine_name, search, dateFrom, dateTo
 */
export async function GET(request) {
  try {
    await connectDB();
    const auth = await authenticate(request);
    if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (auth.role !== 'manufacturer' && auth.role !== 'regulator') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const batchId = url.searchParams.get('batch_id');
    const search = url.searchParams.get('search');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    const query = {};
    // Scope to the manufacturer's own shipments. Regulators see everything.
    // Falls back to the user's own id to stay consistent with how POST assigns
    // manufacturer_id (`manufacturer_id || _id`) for accounts without a linked
    // Manufacturer profile — otherwise they'd see every manufacturer's shipments.
    if (auth.role === 'manufacturer') {
      query.manufacturer_id = manufacturerScope(auth);
    }
    if (status && status !== 'all') query.status = status;
    if (batchId) query.batch_id = batchId;
    if (search) {
      query.$or = [
        { medicine_name: { $regex: search, $options: 'i' } },
        { batch_id: { $regex: search, $options: 'i' } },
        { 'checkpoints.name': { $regex: search, $options: 'i' } },
        { 'checkpoints.address': { $regex: search, $options: 'i' } },
      ];
    }
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const shipments = await Shipment.find(query)
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ shipments });
  } catch (error) {
    console.error('GET /api/supply-chain error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/supply-chain
 * Create a new shipment with checkpoints.
 * Body: { batch_id, medicine_name, medicine_id?, checkpoints: [...], estimated_delivery? }
 */
export async function POST(request) {
  try {
    await connectDB();
    const auth = await authenticate(request);
    if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (auth.role !== 'manufacturer' && auth.role !== 'regulator') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { batch_id, medicine_name, medicine_id, checkpoints, estimated_delivery, status: shipmentStatus } = body;

    if (!batch_id || !medicine_name) {
      return NextResponse.json({ error: 'batch_id and medicine_name are required' }, { status: 400 });
    }
    if (!checkpoints || !Array.isArray(checkpoints) || checkpoints.length < 2) {
      return NextResponse.json({ error: 'At least 2 checkpoints are required (origin and destination)' }, { status: 400 });
    }

    // Validate checkpoints have required fields
    for (let i = 0; i < checkpoints.length; i++) {
      const cp = checkpoints[i];
      if (!cp.name || cp.lat == null || cp.lng == null) {
        return NextResponse.json({ error: `Checkpoint ${i + 1} requires name, lat, and lng` }, { status: 400 });
      }
    }

    // Order checkpoints and set first one as current
    const orderedCheckpoints = checkpoints.map((cp, i) => ({
      ...cp,
      order: i,
      status: i === 0 ? 'completed' : 'pending', // origin is always completed
      actual_arrival: i === 0 ? new Date() : null,
    }));

    // Set the second checkpoint as current (shipment departed origin)
    if (orderedCheckpoints.length > 1) {
      orderedCheckpoints[1].status = 'current';
    }

    const shipment = await Shipment.create({
      medicine_id: medicine_id || null,
      manufacturer_id: manufacturerScope(auth),
      batch_id,
      medicine_name,
      status: shipmentStatus || 'dispatched',
      checkpoints: orderedCheckpoints,
      current_checkpoint_index: 1,
      estimated_delivery: estimated_delivery ? new Date(estimated_delivery) : null,
    });

    return NextResponse.json({ shipment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/supply-chain error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
