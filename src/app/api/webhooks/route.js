import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Webhook from '@/models/Webhook';
import crypto from 'crypto';

// POST /api/webhooks — Register a new webhook
export async function POST(request) {
  try {
    await connectDB();
    const { url, events, owner, owner_role, region } = await request.json();

    if (!url || !owner || !owner_role) {
      return NextResponse.json({
        error: 'url, owner, and owner_role are required',
        valid_roles: ['pharmacy', 'regulator', 'manufacturer'],
        valid_events: ['counterfeit_detected', 'recall_issued', 'anomaly_detected', 'all'],
      }, { status: 400 });
    }

    // Generate shared secret for signature verification
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await Webhook.create({
      url,
      events: events || ['all'],
      owner,
      owner_role,
      region,
      secret,
      active: true,
    });

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook._id,
        url: webhook.url,
        events: webhook.events,
        owner: webhook.owner,
        active: webhook.active,
        secret: webhook.secret, // Only shown once at creation
      },
      message: 'Webhook registered. Save the secret — it won\'t be shown again.',
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating webhook:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/webhooks — List all webhooks
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');

    const query = {};
    if (owner) query.owner = owner;

    const webhooks = await Webhook.find(query)
      .select('-secret') // Never expose secrets in list
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      webhooks: webhooks.map(wh => ({
        id: wh._id,
        url: wh.url,
        events: wh.events,
        owner: wh.owner,
        owner_role: wh.owner_role,
        region: wh.region,
        active: wh.active,
        last_triggered: wh.last_triggered,
        failure_count: wh.failure_count,
      })),
      total: webhooks.length,
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/webhooks — Delete a webhook
export async function DELETE(request) {
  try {
    await connectDB();
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Webhook id is required' }, { status: 400 });
    }

    const result = await Webhook.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Webhook deleted' }, { status: 200 });

  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
