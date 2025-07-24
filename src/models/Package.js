import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  package_id: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: [
      'CREATED',
      'PICKED_UP',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'EXCEPTION',
      'CANCELLED',
    ],
    required: true,
  },
  lat: Number,
  lon: Number,
  event_timestamp: { type: Date, required: true },
  received_at: { type: Date, required: true, default: Date.now },
  note: String,
  eta: Date,
}, { timestamps: true });

const Package = mongoose.model('Package', packageSchema);
export default Package;
