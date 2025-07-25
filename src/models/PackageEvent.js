import mongoose from 'mongoose';

const packageEventSchema = new mongoose.Schema({
  package_id: { type: String, required: true },
  status: { type: String, required: true },
  lat: Number,
  lon: Number,
  note: String,
  eta: Date,
  event_timestamp: { type: Date, required: true },
  received_at: { type: Date, default: () => new Date(Date.now() + 6 * 60 * 60 * 1000) }, // BD time
});

export default mongoose.model('PackageEvent', packageEventSchema);
