import mongoose from 'mongoose';

const scanLogSchema = new mongoose.Schema({
  medicine_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' }, // Might be null if scanned batch doesn't exist
  scanned_at: { type: Date, default: Date.now },
  location_lat: { type: Number },
  location_lng: { type: Number },
  location_city: { type: String },
  result_score: { type: Number }, // Trust score given
  scanned_batch_id: { type: String },
  scanned_serial_number: { type: String },
  // Scanner identity (for smart clone detection)
  user_id:   { type: String, default: null },   // JWT token userId (null = anonymous)
  device_id: { type: String, default: null },   // Request fingerprint for anonymous users
  scan_type: { type: String, enum: ['consumer', 'inventory_check'], default: 'consumer' }, // pharmacy scans = inventory_check
}, { timestamps: true });

const ScanLog = mongoose.models.ScanLog || mongoose.model('ScanLog', scanLogSchema);

export default ScanLog;
