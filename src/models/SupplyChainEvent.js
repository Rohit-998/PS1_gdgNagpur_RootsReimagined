import mongoose from 'mongoose';

const supplyChainEventSchema = new mongoose.Schema({
  medicine_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  event_type: { type: String, required: true }, // "manufactured", "qa_passed", "shipped", "received"
  location: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  prev_hash: { type: String }, // Hash of previous event (blockchain)
  event_hash: { type: String, required: true }, // Hash of this event
}, { timestamps: true });

const SupplyChainEvent = mongoose.models.SupplyChainEvent || mongoose.model('SupplyChainEvent', supplyChainEventSchema);

export default SupplyChainEvent;
