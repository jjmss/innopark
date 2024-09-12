import puppeteer from "puppeteer";

class Parking {
	constructor() {
		this.loginUrl =
			"https://pportal.cowisys.no/steinkjer/Account/Login?ReturnUrl=%2Fsteinkjer%2FContract%2FContracts";
		this.url = "https://pportal.cowisys.no/steinkjer/Contract/Contracts";
		this.browser = null;
		this.closed = true;
		this.timeout = null;
		this.keepAlive();
	}

	async launch() {
		this.browser = await puppeteer.launch({
			headless: true,
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
		});
		this.page = null;
		this.loggedIn = false;
	}

	async keepAlive() {
		this.timeout = setTimeout(async () => {
			await this.exit();
		}, 60000);
	}

	async login() {
		if (this.closed) await this.launch();
		this.page = await this.browser.newPage();

		await this.page.goto(this.loginUrl);

		await this.page.waitForSelector("#loginForm");

		const username = process.env.PPORTAL_USERNAME;
		const password = process.env.PPORTAL_PASSWORD;

		await this.page.type("#UserId", username);
		await this.page.type("#Password", password);

		await this.page.keyboard.press("Enter");

		await this.page.waitForNavigation();
		this.loggedIn = true;
	}

	async getCurrentReg() {
		clearTimeout(this.timeout);
		if (!this.loggedIn) await this.login();
		await this.page.goto(this.url);

		await this.page.waitForSelector("#regnr1-240784");
		const regInput = await this.page.$("#regnr1-240784");
		const reg = await this.page.evaluate((el) => el.value, regInput);
		this.keepAlive();
		return reg;
	}

	async changeReg(newReg) {
		clearTimeout(this.timeout);

		if (!this.loggedIn) await this.login();

		await this.page.goto(this.url);

		const controllerSelector = `div[ng-controller="contractController"]`;
		await this.page.waitForSelector(controllerSelector);
		const controllerEl = await this.page.$(controllerSelector);
		const contractData = await this.page.evaluate((el) => {
			const ngInit = el.getAttribute("ng-init");
			const regex = /initContractData\(\[(.*)\]\)/;
			const match = ngInit.match(regex).pop();
			const json = JSON.parse(match);

			return json;
		}, controllerEl);

		const { contract } = contractData;

		// return;
		await this.page.evaluate(
			async (contract, newReg) => {
				const body = {
					regnr1: newReg,
					regnr2: null,
					regnr3: null,
					contractId: contract.id,
					petitionId: contract.petitionId,
				};
				await fetch("https://pportal.cowisys.no/steinkjer/api/web/contractwebapi/UpdateRegnrPetitionValue", {
					body: JSON.stringify(body),
					method: "POST",
					headers: {
						accept: "application/json, text/plain, */*",
						"content-type": "application/json;charset=UTF-8",
					},
				});
			},
			contract,
			newReg
		);
		this.keepAlive();
	}

	async exit() {
		clearTimeout(this.timeout);
		this.closed = true;
		this.loggedIn = false;
		if (this.browser) {
			await this.page.close();
			await this.browser.close();
		}
	}
}

export default Parking;
