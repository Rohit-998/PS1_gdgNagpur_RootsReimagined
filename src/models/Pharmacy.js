import mongoose from 'mongoose';

const pharmacySchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  trust_score: { type: Number, default: 100 }, // 0-100
  total_scans: { type: Number, default: 0 },
  flagged_count: { type: Number, default: 0 },
}, { timestamps: true });

const Pharmacy = mongoose.models.Pharmacy || mongoose.model('Pharmacy', pharmacySchema);

export default Pharmacy;
