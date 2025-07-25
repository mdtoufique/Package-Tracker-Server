import cron from 'node-cron';
import Package from '../models/Package.js';
import Alert from '../models/Alert.js';
import PackageEvent from "../models/PackageEvent.js";
// Define stuck threshold in minutes
const STUCK_THRESHOLD_MINUTES = 30;

export function startAlertService() {
  // Runs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log(`[AlertService] Checking stuck packages at ${new Date().toISOString()}`);

    try {
      // Calculate cutoff time for stuck packages (Bangladesh time)
      const cutoff = new Date(Date.now() + 6 * 60 * 60 * 1000 - STUCK_THRESHOLD_MINUTES * 60 * 1000);

      // Find active packages that haven't updated since cutoff
      const stuckPackages = await Package.find({
        event_timestamp: { $lte: cutoff },
        status: { $nin: ['DELIVERED', 'CANCELLED','STUCK'] },
      });

      for (const pkg of stuckPackages) {
        // Check if an alert already exists for this stuck state
        const existingAlert = await Alert.findOne({
          package_id: pkg.package_id,
          resolved: false,
        });

        if (!existingAlert) {
          // Create new alert
          const alert = new Alert({
            package_id: pkg.package_id,
            message: `Package ${pkg.package_id} stuck in state "${pkg.status}" for over ${STUCK_THRESHOLD_MINUTES} minutes.`,
            created_at: new Date(Date.now() + 6 * 60 * 60 * 1000),
            resolved: false,
            resolved_at: null,
          });
          await alert.save();
          //pruct state event update
          await PackageEvent.create({
                package_id: pkg.package_id,
                status:"STUCK",
                lat:pkg.lat,
                lon:pkg.lon,
                note:pkg.note,
                eta: pkg.eta,
                event_timestamp:new Date(Date.now() + 6 * 60 * 60 * 1000),
                received_at:pkg.received_at,
                });

          // Update package status to STUCK
            pkg.status = 'STUCK';
            await pkg.save();
          console.log(`[AlertService] Alert created for package: ${pkg.package_id}`);
        } else {
          console.log(`[AlertService] Alert already exists for package: ${pkg.package_id}`);
        }
      }

      // Resolve alerts for packages no longer stuck
      const now = new Date(Date.now() + 6 * 60 * 60 * 1000);
      const recentCutoff = new Date(now - STUCK_THRESHOLD_MINUTES * 60 * 1000);

      const activeAlerts = await Alert.find({ resolved: false });

      for (const alert of activeAlerts) {
        const pkg = await Package.findOne({ package_id: alert.package_id });
        if (!pkg) continue;

        if (
          pkg.status === 'DELIVERED' ||
          pkg.status === 'CANCELLED' ||
          pkg.event_timestamp > recentCutoff
        ) {
          alert.resolved = true;
          alert.resolved_at = new Date(Date.now() + 6 * 60 * 60 * 1000);
          await alert.save();
          console.log(`[AlertService] Alert resolved for package: ${alert.package_id}`);
        }
      }
    } catch (error) {
      console.error('[AlertService] Error checking stuck packages:', error);
    }
  });
}
