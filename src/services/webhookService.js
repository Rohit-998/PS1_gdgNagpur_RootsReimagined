// Webhook firing service
// Sends real-time notifications to registered webhook endpoints

import Webhook from '../models/Webhook.js';
import connectDB from '../lib/mongodb.js';
import crypto from 'crypto';

/**
 * Fire webhooks for a specific event
 * @param {string} eventType - 'counterfeit_detected', 'recall_issued', 'anomaly_detected'
 * @param {Object} payload - Event data to send
 */
export async function fireWebhooks(eventType, payload) {
  await connectDB();

  // Find all active webhooks subscribed to this event
  const webhooks = await Webhook.find({
    active: true,
    $or: [
      { events: eventType },
      { events: 'all' }
    ]
  });

  const results = [];

  for (const webhook of webhooks) {
    // If webhook has a region filter, check if it matches
    if (webhook.region && payload.region && !payload.region.toLowerCase().includes(webhook.region.toLowerCase())) {
      continue;
    }

    try {
      // Create signature for verification
      const signature = webhook.secret
        ? crypto.createHmac('sha256', webhook.secret).update(JSON.stringify(payload)).digest('hex')
        : null;

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SafeDose-Event': eventType,
          'X-SafeDose-Timestamp': new Date().toISOString(),
          ...(signature && { 'X-SafeDose-Signature': `sha256=${signature}` }),
        },
        body: JSON.stringify({
          event: eventType,
          timestamp: new Date().toISOString(),
          data: payload,
        }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      await Webhook.findByIdAndUpdate(webhook._id, {
        last_triggered: new Date(),
        failure_count: 0,
      });

      results.push({ webhook_id: webhook._id, status: 'sent', statusCode: response.status });
    } catch (error) {
      // Increment failure count
      await Webhook.findByIdAndUpdate(webhook._id, {
        $inc: { failure_count: 1 },
      });

      // Disable webhook after 5 consecutive failures
      if (webhook.failure_count >= 4) {
        await Webhook.findByIdAndUpdate(webhook._id, { active: false });
      }

      results.push({ webhook_id: webhook._id, status: 'failed', error: error.message });
    }
  }

  return results;
}
