import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shipment from '@/models/Shipment';
import { authenticate } from '@/middleware/auth';
import { manufacturerScope } from '@/lib/supplyChainAccess';

/**
 * GET /api/supply-chain/stats
 * Aggregated supply chain statistics for the authenticated manufacturer.
 */
export async function GET(request) {
  try {
    await connectDB();
    const auth = await authenticate(request);
    if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (auth.role !== 'manufacturer' && auth.role !== 'regulator') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const query = {};
    // Scope to the manufacturer's own shipments (consistent with POST's
    // `manufacturer_id || _id`). Regulators see aggregated stats across all.
    if (auth.role === 'manufacturer') {
      query.manufacturer_id = manufacturerScope(auth);
    }

    const allShipments = await Shipment.find(query).lean();

    const activeStatuses = ['preparing', 'packed', 'dispatched', 'in_transit', 'reached_checkpoint', 'out_for_delivery', 'delayed'];
    const activeShipments = allShipments.filter(s => activeStatuses.includes(s.status));
    const completedDeliveries = allShipments.filter(s => s.status === 'delivered');
    const delayedShipments = allShipments.filter(s => s.status === 'delayed');
    const inTransit = allShipments.filter(s => ['in_transit', 'dispatched', 'out_for_delivery'].includes(s.status));

    // Behind schedule: an active shipment whose current checkpoint's expected
    // arrival is already in the past but hasn't been reached yet.
    const now = Date.now();
    const behindSchedule = activeShipments.filter(s => {
      const idx = s.current_checkpoint_index ?? 0;
      const cp = s.checkpoints?.[idx];
      return cp && cp.expected_arrival && !cp.actual_arrival &&
        new Date(cp.expected_arrival).getTime() < now;
    });

    // Average delivery time (for completed shipments)
    let avgDeliveryHours = 0;
    if (completedDeliveries.length > 0) {
      const totalMs = completedDeliveries.reduce((sum, s) => {
        if (s.actual_delivery && s.createdAt) {
          return sum + (new Date(s.actual_delivery) - new Date(s.createdAt));
        }
        return sum;
      }, 0);
      avgDeliveryHours = Math.round(totalMs / completedDeliveries.length / (1000 * 60 * 60));
    }

    // Unique pharmacies served (destination checkpoints of type 'pharmacy')
    const pharmaciesServed = new Set();
    allShipments.forEach(s => {
      const lastCp = s.checkpoints?.[s.checkpoints.length - 1];
      if (lastCp && lastCp.type === 'pharmacy') {
        pharmaciesServed.add(lastCp.name);
      }
    });

    return NextResponse.json({
      totalShipments: allShipments.length,
      activeShipments: activeShipments.length,
      completedDeliveries: completedDeliveries.length,
      delayedShipments: delayedShipments.length,
      behindSchedule: behindSchedule.length,
      inTransit: inTransit.length,
      avgDeliveryHours,
      pharmaciesServed: pharmaciesServed.size,
    });
  } catch (error) {
    console.error('GET /api/supply-chain/stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
