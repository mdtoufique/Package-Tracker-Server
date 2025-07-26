import express from 'express';
import Alert from '../models/Alert.js';
import  {checkStuckPackages} from '../services/alertServiceCJ.js';
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

router.post('/check-stuck', authMiddleware, async (req, res) => {
  try {
    await checkStuckPackages();
    res.status(200).json({ message: 'Stuck package check completed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check stuck packages' });
  }
});



router.get("/count", async (req, res) => {
  try {
    const resolved = req.query.resolved === "true";
    const count = await Alert.countDocuments({ resolved });
    res.json({ count });
  } catch (error) {
    console.error("❌ Failed to count alerts:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
