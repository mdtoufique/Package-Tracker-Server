// api/index.js
import app from '../src/app.js';
import connectDB from '../src/db.js';
import { startAlertService } from '../src/alertService.js';

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
