import mongoose from 'mongoose';

const checkpointSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  type:             { type: String, enum: [
    'factory', 'warehouse', 'distribution_center', 'shipment_yard',
    'regional_hub', 'transport_hub', 'retail_warehouse', 'pharmacy', 'custom'
  ], default: 'custom' },
  lat:              { type: Number, required: true },
  lng:              { type: Number, required: true },
  address:          { type: String, default: '' },
  contact_person:   { type: String, default: '' },
  expected_arrival: { type: Date },
  actual_arrival:   { type: Date, default: null },
  departure_time:   { type: Date, default: null },
  status:           { type: String, enum: ['pending', 'current', 'completed', 'skipped'], default: 'pending' },
  notes:            { type: String, default: '' },
  order:            { type: Number, required: true },
}, { _id: true });

const shipmentSchema = new mongoose.Schema({
  medicine_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
  manufacturer_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer', required: true },
  batch_id:         { type: String, required: true },
  medicine_name:    { type: String, required: true },
  status:           { type: String, enum: [
    'preparing', 'packed', 'dispatched', 'in_transit',
    'reached_checkpoint', 'delayed', 'out_for_delivery',
    'delivered', 'cancelled'
  ], default: 'preparing' },
  checkpoints:              [checkpointSchema],
  current_checkpoint_index: { type: Number, default: 0 },
  estimated_delivery:       { type: Date },
  actual_delivery:          { type: Date, default: null },
}, { timestamps: true });

shipmentSchema.index({ manufacturer_id: 1 });
shipmentSchema.index({ batch_id: 1 });
shipmentSchema.index({ status: 1 });

const Shipment = mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema);

export default Shipment;
