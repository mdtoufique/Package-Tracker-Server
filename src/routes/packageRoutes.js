import express from 'express';
import { ingestPackageUpdate, getActivePackages } from '../controllers/packageController.js';

const router = express.Router();

router.post('/update', ingestPackageUpdate);
router.get('/active', getActivePackages);

export default router;
