import mongoose from 'mongoose';

const webhookSchema = new mongoose.Schema({
  url: { type: String, required: true },
  events: [{ type: String, enum: ['counterfeit_detected', 'recall_issued', 'anomaly_detected', 'all'] }],
  owner: { type: String, required: true }, // pharmacy name, regulator ID, etc.
  owner_role: { type: String, enum: ['pharmacy', 'regulator', 'manufacturer'], required: true },
  region: { type: String }, // Optional: only get alerts for this region
  active: { type: Boolean, default: true },
  secret: { type: String }, // Shared secret for webhook signature verification
  last_triggered: { type: Date },
  failure_count: { type: Number, default: 0 },
}, { timestamps: true });

webhookSchema.index({ active: 1 });
webhookSchema.index({ events: 1 });

const Webhook = mongoose.models.Webhook || mongoose.model('Webhook', webhookSchema);

export default Webhook;
