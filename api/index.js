// api/index.js
import app from '../src/app.js';
import connectDB from '../src/utils/db.js';
import { startAlertService } from '../src/services/alertService.js';


// Debug: Log directory contents
console.log('Files in /var/task:', fs.readdirSync('/var/task'));
console.log('Files in /var/task/src:', fs.readdirSync('/var/task/src').catch(() => 'src not found'));

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
