import express from "express";
import Parking from "./lib/bot.js";

const park = new Parking();

const port = process.env.PORT || 4312;

const app = express();

app.use(express.json());

app.use((req, res, next) => {
	const secret = req.headers["x-secret"];

	res.set("Content-Type", "text/plain");
	if (secret !== process.env.APP_SECRET) {
		return res.status(403).send("No access");
	}

	next();
});

app.get("/current", async (req, res) => {
	const current = await park.getCurrentReg();

	return res.status(200).send(current);
});

app.get("/change/:reg", async (req, res) => {
	const newReg = req.params.reg;

	await park.changeReg(newReg);
	const current = await park.getCurrentReg();

	return res.status(200).send(current);
});

app.listen(port, () => {
	console.log(`Running on http://localhost:${port}`);
});
