import Package from '../models/Package.js';

export const ingestPackageUpdate = async (req, res) => {
  try {
    const {
      package_id,
      status,
      lat,
      lon,
      timestamp,
      note,
      eta,
    } = req.body;

    const event_timestamp = new Date(timestamp);
    const received_at = new Date();

    const existing = await Package.findOne({ package_id });

    if (!existing) {
      // Create new package entry
      const newPkg = await Package.create({
        package_id,
        status,
        lat,
        lon,
        event_timestamp,
        received_at,
        note,
        eta,
      });
      return res.status(201).json(newPkg);
    }

    // Update if the new event is newer
    if (new Date(existing.event_timestamp) < event_timestamp) {
      existing.status = status;
      existing.lat = lat;
      existing.lon = lon;
      existing.event_timestamp = event_timestamp;
      existing.received_at = received_at;
      existing.note = note;
      existing.eta = eta;
      await existing.save();
    }

    return res.status(200).json(existing);
  } catch (error) {
    console.error('Ingest failed:', error);
    return res.status(500).json({ error: 'Failed to process package update' });
  }
};
