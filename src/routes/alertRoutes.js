import express from 'express';
import Alert from '../models/Alert.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { resolved } = req.query;
    const filter = {};
    if (resolved === 'false') filter.resolved = false;
    else if (resolved === 'true') filter.resolved = true;

    const alerts = await Alert.find(filter).sort({ created_at: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

export default router;
