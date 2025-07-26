import express from "express";
import Package from "../models/Package.js";
import Alert from "../models/Alert.js";
import PackageEvent from "../models/PackageEvent.js";
const router = express.Router();

// Utility: Get current Bangladesh time
const bdNow = (d = new Date()) => new Date(new Date(d).getTime() + 6 * 60 * 60 * 1000);


// POST /api/packages/update
router.post("/update", async (req, res) => {
	try {
		const { package_id, status, lat, lon, timestamp, note, eta } = req.body;

        const getLastValidStatus = async (package_id) => {
			const events = await PackageEvent.find({ package_id }).sort({
				event_timestamp: -1,
			});

			for (const event of events) {
				if (!["EXCEPTION", "STUCK"].includes(event.status)) {
					return event.status;
				}
			}

			return null; // no valid status found
		};

        //bd time paisi
		const event_timestamp = new Date(timestamp);
        // bd time e ase but boltese us
		const received_at = bdNow();

		const existing = await Package.findOne({ package_id });

		let updatedPkg;
		const existingEvent = await Package.findOne({ package_id });
        // if(existingEvent && (existing.status==="CANCELLED" || existing.status==="DELIVERED"))
        // {
        //     return res
		// 		.status(409)
		// 		.json({
		// 			message: `Package ${package_id} CANCELLED or DELIVERED.`,
		// 		});
		// }
        let lastValidStatus;
        let EXCP="";
        if (existingEvent) 
        {
			lastValidStatus = existing.status;
		}

        
        if((existingEvent && lastValidStatus===null) ||(existingEvent && lastValidStatus===undefined))
        {
            return res
				.status(409)
				.json({
					message: `For Package ${package_id} last valid sate is unknown.`,
				});
        }

        
        if (existingEvent && ["EXCEPTION", "STUCK"].includes(lastValidStatus)) {
            let TMP=lastValidStatus;
			lastValidStatus = await getLastValidStatus(package_id);
            EXCP=`Package ${package_id} is in ${TMP}. Last valid status for `;
		}

        if(existingEvent && (lastValidStatus==="CANCELLED" || lastValidStatus==="DELIVERED"))
        {
            return res
				.status(409)
				.json({
					message: `Package ${package_id} already ${lastValidStatus}.`,
				});
		}
        if (existingEvent && status==="CREATED") {
			return res
				.status(409)
				.json({
					message: `Package ${package_id} already CREATED.`,
				});
		}
        if(!existingEvent && status!=="CREATED")
        {
            return res
				.status(409)
				.json({
					message: `Package ${package_id} Not Created yet.`,
				});
		}
        if(existingEvent && lastValidStatus!=="CREATED" && status==="CANCELLED")
        {
            return res
				.status(409)
				.json({
					message: `${EXCP}Package ${package_id} is in ${lastValidStatus}. Cant be cancelled after PICK UP.`,
				});
		}
        if(existingEvent && lastValidStatus==="CREATED" && !(status==="PICKED_UP" ||status==="CANCELLED" ||status==="EXCEPTION"))
        {
            return res
				.status(409)
				.json({
					message: `${EXCP}Package ${package_id} is in CREATED .CANT be ${status}.`,
				});
		}
        if(existingEvent && lastValidStatus==="PICKED_UP" && !(status==="IN_TRANSIT" || status==="EXCEPTION"))
        {
            return res
				.status(409)
				.json({
					message: `${EXCP}Package ${package_id}  is PICKED UP. CANT be ${status}.`,
				});
		}

        if(existingEvent && lastValidStatus==="IN_TRANSIT" && !(status==="OUT_FOR_DELIVERY" || status==="EXCEPTION"))
        {
            return res
				.status(409)
				.json({
					message: `${EXCP}Package ${package_id}  is IN TRANSIT. CANT be ${status}.`,
				});
		}
        if(existingEvent && lastValidStatus==="OUT_FOR_DELIVERY" && !(status==="DELIVERED" || status==="EXCEPTION"))
        {
            return res
				.status(409)
				.json({
					message: `${EXCP}Package ${package_id}  is IN OUT FOR DELIVERY. CANT be ${status}.`,
				});
		}
        
        
		
        
        //console.log(eta);
		if (!existing) {
			updatedPkg = await Package.create({
				package_id,
				status,
				lat,
				lon,
				event_timestamp,
				received_at,
				note,
				eta: eta ? eta : undefined

			});
		} else {
			const isNewer =
				existing.event_timestamp < event_timestamp;
			const isDifferent =
				existing.status !== status ||
				existing.lat !== lat ||
				existing.lon !== lon ||
				existing.note !== note ||
				(existing.eta?.toISOString() || null) !==
					(eta ? eta.toISOString() : null);

            // console.log(isNewer,isDifferent);
            // console.log(typeof(existing.event_timestamp),typeof(event_timestamp))
			if (isNewer && isDifferent) {
				existing.status = status;
				existing.lat = lat;
				existing.lon = lon;
				existing.event_timestamp = event_timestamp;
				existing.received_at = received_at;
				existing.note = note;
				existing.eta = eta ? eta : existing.eta;

				await existing.save();
			}

			updatedPkg = existing;
		}
        // --- ✅ Log Event to PackageEvent collection ---
		await PackageEvent.create({
			package_id,
			status,
			lat,
			lon,
			note,
			eta: eta ? eta : undefined,
			event_timestamp,
			received_at,
		});

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
router.get("/all", async (req, res) => {
	try {
		const cutoff = new Date(bdNow() - 24 * 60 * 60 * 1000); // 24h ago from BD time
		const packages = await Package.find({
			//status: { $nin: ["DELIVERED", "CANCELLED"] },
			event_timestamp: { $gte: cutoff },
		}).sort({ event_timestamp: -1 });

		res.status(200).json(packages);
	} catch (error) {
		console.error("❌ Failed to fetch packages:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});





// GET /api/packages/:id/history
router.get("/:id/history", async (req, res) => {
	try {
		const package_id = req.params.id;

		const events = await PackageEvent.find({ package_id }).sort({
			event_timestamp: 1, // chronological order
		});

		if (!events || events.length === 0) {
			return res
				.status(404)
				.json({ message: "No history found for this package" });
		}

		res.status(200).json(events);
	} catch (error) {
		console.error("❌ Failed to fetch package history:", error);
		res.status(500).json({ error: "Failed to fetch history" });
	}
});

export default router;