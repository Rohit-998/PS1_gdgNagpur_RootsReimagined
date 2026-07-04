import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  manufacturer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer', required: true },
  batch_id: { type: String, required: true },
  serial_number: { type: String, required: true },
  hash: { type: String, required: true },
  mfg_date: { type: Date, required: true },
  exp_date: { type: Date, required: true },
  is_genuine: { type: Boolean, default: true },
  authorized_region: { type: String, required: true },
  // Recall fields
  recalled: { type: Boolean, default: false },
  recall_reason: { type: String },
  recall_date: { type: Date },
  // Drug information fields
  category: { type: String }, // "analgesic", "antibiotic", "antidiabetic", etc.
  strength: { type: String }, // "500mg", "250mg"
  dosage: { type: String },
  side_effects: [{ type: String }],
  instructions: { type: String },
  alternatives: [{ type: String }],
  drug_interactions: [{ type: String }], // medicine names that interact
}, { timestamps: true });

medicineSchema.index({ batch_id: 1, serial_number: 1 }, { unique: true });

const Medicine = mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);

export default Medicine;
