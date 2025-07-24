import app from "./app.js";
import connectDB from "./utils/db.js";
import dotenv from "dotenv";
import { startAlertService } from "./services/alertService.js";

dotenv.config(); // Load .env variables

const PORT = process.env.PORT || 5000;

// Connect to DB, then start server
connectDB().then(() => {
	startAlertService();
	app.listen(PORT, () => {
		console.log(`🚀 Server running on http://localhost:${PORT}`);
	});
});
