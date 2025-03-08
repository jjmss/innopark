import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import supabase, { getUserByApiKey } from "./lib/supabase.js";
import manager from "./lib/manager.js";
import Parking from "./lib/bot.js";
import { encrypt } from "./lib/encryption.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 4312;

const app = express();

const useParking = async (req, res, next) => {
	const apiKey = req.headers["x-secret"] ?? req.query.apiKey;
	const user = await getUserByApiKey(apiKey);

	if (!user) {
		res.set("Content-Type", "text/plain");
		return res.status(403).send("No access");
	}

	req.user = manager.getInstance(user);

	next();
};

// Set EJS as the template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Specify the views directory

// Serve static files from /public
app.use(
	"/public",
	express.static("public", {
		index: false, // Prevent serving index.html automatically
	})
);

// Routes to render EJS templates
app.get("/", (req, res) => {
	res.render("index"); // Renders views/index.ejs
});

app.get("/oppsett", (req, res) => {
	res.render("oppsett"); // Renders views/oppsett.ejs
});
app.get("/tos", (req, res) => {
	res.render("tos"); // Renders views/oppsett.ejs
});

app.use(express.json());

app.post("/api/validate", async (req, res) => {
	const { username, password } = req.body;
	const park = new Parking({ username, password });

	try {
		await park.login();
		const contracts = await park.getContracts();
		park.exit();

		return res.status(200).json({ success: true, data: contracts });
	} catch (err) {
		park.exit();
		return res.status(403).json({ message: err.message, success: false });
	}
});

app.post("/api/generate", async (req, res) => {
	const { username, password, contractId } = req.body;
	const park = new Parking({ username, password });

	try {
		await park.login();
		const contract = await park.getContract(contractId);

		if (!contract) {
			throw new Error("The contract was not found or is not valid.");
		}
		const { data, error } = await supabase
			.from("users")
			.insert({ username, password: encrypt(password), contractId })
			.select();

		const user = data.shift();

		return res.status(200).json({ data: user.id, success: true });
	} catch (err) {
		return res.status(400).json({ message: err.message, success: false });
	}
});

app.get("/api/contracts", useParking, async (req, res) => {
	try {
		const contracts = await req.user.getContracts();
		return res.status(200).json(contracts);
	} catch (err) {
		return res.status(403).json({ message: err.message, success: false });
	}
});

app.get("/api/current/", useParking, async (req, res) => {
	try {
		const { contractId } = req.params;

		const contract = await req.user.getContract(contractId);

		if (!contract) {
			return res.status(404).send("Contract not found");
		}
		const current = await req.user.getCurrentReg(contractId);

		return res.status(200).send(current);
	} catch (err) {
		return res.status(403).json({ message: err.message, success: false });
	}
});

app.get("/api/change/:reg", useParking, async (req, res) => {
	try {
		const newReg = req.params.reg;

		await req.user.changeReg(newReg);
		const current = await req.user.getCurrentReg();

		return res.status(200).send(current);
	} catch (err) {
		return res.status(403).json({ message: err.message, success: false });
	}
});

app.listen(port, () => {
	console.log(`Running on http://localhost:${port}`);
});
