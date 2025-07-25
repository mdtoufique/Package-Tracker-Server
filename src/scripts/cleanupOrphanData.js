import mongoose from 'mongoose';
import Package from '../models/Package.js';
import PackageEvent from '../models/PackageEvent.js';
import Alert from '../models/Alert.js';

import dotenv from 'dotenv';


dotenv.config();
const MONGO_URI = process.env.MONGO_URI;


async function cleanupOrphanData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Step 1: Get all valid package IDs
    const validPackages = await Package.find({}, { package_id: 1 }).lean();
    const validSet = new Set(validPackages.map(p => p.package_id));

    // Step 2: Delete orphaned PackageEvents
    const eventResult = await PackageEvent.deleteMany({
      package_id: { $nin: Array.from(validSet) }
    });
    console.log(`🗑️  Deleted ${eventResult.deletedCount} orphan PackageEvents.`);

    // Step 3: Delete orphaned Alerts
    const alertResult = await Alert.deleteMany({
      package_id: { $nin: Array.from(validSet) }
    });
    console.log(`🗑️  Deleted ${alertResult.deletedCount} orphan Alerts.`);

  } catch (err) {
    console.error("❌ Cleanup failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

cleanupOrphanData();
