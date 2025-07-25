// api/index.js
import app from '../app.js';
import connectDB from '../utils/db.js';
import { startAlertService } from '../services/alertService.js';

// Ensure DB is connected and services started
let isInitialized = false;

export default async function handler(req, res) {
  if (!isInitialized) {
    await connectDB();
    startAlertService();
    isInitialized = true;
  }

  app(req, res); // Forward request to Express app
}
