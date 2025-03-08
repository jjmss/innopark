import Parking from "./bot.js";

class Manager {
	constructor() {
		this.instances = new Map();
		this.timeouts = new Map();
	}

	keepInstanceAlive(apiKey) {
		clearTimeout(this.timeouts.get(apiKey));
		this.timeouts.set(
			apiKey,
			setTimeout(() => {
				this.deleteInstance(apiKey);
			}, 10 * 1000)
		);
	}

	/**
	 *
	 * @param {*} user
	 * @returns {Parking}
	 */
	getInstance(user) {
		this.keepInstanceAlive(user.apiKey);
		const instance = this.instances.get(user.apiKey) || this.createInstance(user);
		return instance;
	}

	createInstance(user) {
		const instance = new Parking(user);
		this.instances.set(user.apiKey, instance);

		return instance;
	}

	deleteInstance(apiKey) {
		const instance = this.instances.get(apiKey);
		if (instance) {
			console.log(`cleaning instance ${apiKey}`);
			instance.exit();
		}

		this.instances.delete(apiKey);
	}
}

const manager = new Manager();

export default manager;
