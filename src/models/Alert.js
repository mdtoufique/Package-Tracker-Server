import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  package_id: { type: String, required: true },
  message: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false },
  resolved_at: { type: Date }, 
});

// Unique index to prevent duplicate active alerts for same package and message
alertSchema.index(
  { package_id: 1, message: 1, resolved: 1 },
  { unique: true, partialFilterExpression: { resolved: false } }
);

export default mongoose.model('Alert', alertSchema);

