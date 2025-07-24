import express from 'express';
import { ingestPackageUpdate } from '../controllers/packageController.js';

const router = express.Router();

router.post('/update', ingestPackageUpdate);

export default router;
