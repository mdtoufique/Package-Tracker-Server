// api/index.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../src/app.js';
import connectDB from '../src/utils/db.js';
import { startAlertService } from '../src/services/alertService.js';

// Debug: Log file structure
console.log('Files in /var/task:', fs.readdirSync('/var/task'));
try {
  console.log('Files in /var/task/src:', fs.readdirSync('/var/task/src'));
  console.log('Resolved path for app.js:', path.resolve(fileURLToPath(import.meta.url), '../src/app.js'));
} catch (err) {
  console.log('Error reading /var/task/src:', err.message);
}

let isInitialized = false;

export default async function handler(req, res) {
  if (!isInitialized) {
    await connectDB();
    startAlertService();
    isInitialized = true;
  }
  app(req, res);
}