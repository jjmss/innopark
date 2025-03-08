import puppeteer from "puppeteer";

class Parking {
	#username;
	#password;
	#contractId;

	constructor({ username, password, contractId }) {
		this.#username = username;
		this.#password = password;
		this.#contractId = contractId;
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

		await this.page.type("#UserId", this.#username);
		await this.page.type("#Password", this.#password);

		await this.page.keyboard.press("Enter");

		await this.page.waitForNavigation();

		if (this.page.url() != this.loginUrl) {
			this.loggedIn = true;
			return true;
		} else {
			this.loggedIn = false;
			this.exit();
			throw new Error("Not able to login with provided credentials.");
		}
	}

	async getContracts() {
		clearTimeout(this.timeout);

		if (!this.loggedIn) await this.login();

		const currentUrl = this.page.url();
		if (currentUrl !== this.url) {
			await this.page.goto(this.url);
		}

		const controllerSelector = `div[ng-controller="contractController"]`;
		await this.page.waitForSelector(controllerSelector);
		const controllerEl = await this.page.$(controllerSelector);
		const contracts = await this.page.evaluate((el) => {
			const ngInit = el.getAttribute("ng-init");
			const regex = /initContractData\((.*)\)/;
			const match = ngInit.match(regex).pop();
			const json = JSON.parse(match);
			return json;
		}, controllerEl);

		this.keepAlive();
		return contracts;
	}

	async getContract(contractId) {
		const contracts = await this.getContracts();
		return contracts.find(({ contract }) => contract.id == contractId);
	}

	async getCurrentReg() {
		clearTimeout(this.timeout);
		if (!this.loggedIn) await this.login();
		await this.page.goto(this.url);

		await this.page.waitForSelector(`#regnr1-${this.#contractId}`);
		const regInput = await this.page.$(`#regnr1-${this.#contractId}`);
		const reg = await this.page.evaluate((el) => el.value, regInput);
		this.keepAlive();
		return reg;
	}

	async changeReg(newReg) {
		clearTimeout(this.timeout);

		if (!this.loggedIn) await this.login();

		await this.page.goto(this.url);
		const { contract } = await this.getContract(this.#contractId);

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
