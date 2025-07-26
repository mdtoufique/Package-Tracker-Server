
import app from '../src/app.js';
import connectDB from '../src/utils/db.js';
import { startAlertService } from '../src/services/alertService.js';


let isInitialized = false;

export default async function handler(req, res) {
  if (!isInitialized) {
    await connectDB();
    //startAlertService();
    isInitialized = true;
  }
  app(req, res);
}