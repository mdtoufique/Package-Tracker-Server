export function verifyApiToken(req, res, next) {
	const clientToken = req.headers["x-api-token"];
	const serverToken = process.env.API_TOKEN;

	if (!clientToken || clientToken !== serverToken) {
		return res.status(401).json({ message: "Unauthorized: Invalid or missing API token" });
	}
	next();
}
