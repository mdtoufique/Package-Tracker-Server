import express from "express";
import Package from "../models/Package.js";
import Alert from "../models/Alert.js";

const router = express.Router();

// Utility: Get current Bangladesh time
const bdNow = () => new Date(Date.now() + 6 * 60 * 60 * 1000);

// POST /api/packages/update
router.post("/update", async (req, res) => {
	try {
		const { package_id, status, lat, lon, timestamp, note, eta } = req.body;

		const event_timestamp = new Date(
			new Date(timestamp).getTime() + 6 * 60 * 60 * 1000
		);
		const received_at = bdNow();

		const existing = await Package.findOne({ package_id });

		let updatedPkg;

		if (!existing) {
			updatedPkg = await Package.create({
				package_id,
				status,
				lat,
				lon,
				event_timestamp,
				received_at,
				note,
				eta: eta
					? new Date(new Date(eta).getTime() + 6 * 60 * 60 * 1000)
					: undefined,
			});
		} else {
			const isNewer =
				new Date(existing.event_timestamp) < event_timestamp;
			const isDifferent =
				existing.status !== status ||
				existing.lat !== lat ||
				existing.lon !== lon ||
				existing.note !== note ||
				(existing.eta?.toISOString() || null) !==
					(eta
						? new Date(
								new Date(eta).getTime() + 6 * 60 * 60 * 1000
						  ).toISOString()
						: null);

			if (isNewer && isDifferent) {
				existing.status = status;
				existing.lat = lat;
				existing.lon = lon;
				existing.event_timestamp = event_timestamp;
				existing.received_at = received_at;
				existing.note = note;
				existing.eta = eta
					? new Date(new Date(eta).getTime() + 6 * 60 * 60 * 1000)
					: undefined;
				await existing.save();
			}

			updatedPkg = existing;
		}

		// --- ✅ Alert Resolver Logic ---
		const STUCK_THRESHOLD_MINUTES = 30;
		const recentCutoff = new Date(
			bdNow() - STUCK_THRESHOLD_MINUTES * 60 * 1000
		);

		if (
			updatedPkg.status === "DELIVERED" ||
			updatedPkg.status === "CANCELLED" ||
			updatedPkg.event_timestamp > recentCutoff
		) {
			const activeAlert = await Alert.findOne({
				package_id: updatedPkg.package_id,
				resolved: false,
			});

			if (activeAlert) {
				activeAlert.resolved = true;
				activeAlert.resolved_at = bdNow();
				await activeAlert.save();
				console.log(
					`✅ Alert resolved for package: ${updatedPkg.package_id}`
				);
			}
		}

		return res.status(200).json(updatedPkg);
	} catch (error) {
		console.error("❌ Ingest failed:", error);
		res.status(500).json({ error: "Failed to process package update" });
	}
});

// GET /api/packages/active
router.get("/active", async (req, res) => {
	try {
		const cutoff = new Date(bdNow() - 24 * 60 * 60 * 1000); // 24h ago from BD time
		const packages = await Package.find({
			status: { $nin: ["DELIVERED", "CANCELLED"] },
			event_timestamp: { $gte: cutoff },
		}).sort({ event_timestamp: -1 });

		res.status(200).json(packages);
	} catch (error) {
		console.error("❌ Failed to fetch packages:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
