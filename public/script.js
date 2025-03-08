class APICaller {
	#username;
	#password;
	constructor() {}

	async validateLogin(username, password, callback) {
		try {
			const response = await fetch("/api/validate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username, password }),
			});

			const { data, success } = await response.json();

			if (!success) {
				throw new Error("Invalid credentials, not able to login and verify.");
			}

			this.#username = username;
			this.#password = password;

			callback(data);
		} catch (err) {
			console.log(err);
			alert(err.message);
		}
	}

	async generateApiKey(contractId, callback) {
		try {
			const response = await fetch("/api/generate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username: this.#username, password: this.#password, contractId: contractId }),
			});

			const { data, success } = await response.json();

			if (!success) {
				throw new Error("Failed to generate API key");
			}

			callback(data);
		} catch (err) {
			console.log(err);
			alert(err.message);
		}
	}
}

window.onload = () => {
	const uiRoot = document.querySelector(".interactive-ui");

	if (uiRoot) {
		const apiCaller = new APICaller();

		const setLoading = (bool) => {
			bool ? uiRoot.classList.add("loading") : uiRoot.classList.remove("loading");
		};

		const setTabIndexForChildren = (parentElement, tabIndexValue = -1) => {
			console.log(parentElement);
			parentElement.querySelectorAll("a, button, input, textarea, select, [tabindex]").forEach((element) => {
				element.tabIndex = tabIndexValue;
			});
		};

		const setStage = (stageIndex, animate = true) => {
			const stageElement = uiRoot.children[stageIndex - 1];
			Array.from(uiRoot.children).forEach((child, index) =>
				setTabIndexForChildren(child, index == stageIndex - 1 ? 0 : -1)
			);

			setTimeout(
				() => {
					const { height } = stageElement.getBoundingClientRect();

					uiRoot.style.maxHeight = `${height}px`;
				},
				animate ? 1 : 0
			);

			uiRoot.style.setProperty("--stage", stageIndex);
			if (animate) {
				uiRoot.tabIndex = "0";
				uiRoot.focus();
				uiRoot.tabIndex = "-1";
			}
		};

		const form = document.querySelector("#verify-form");
		const contractForm = document.querySelector("#contract-form");

		setStage(1, false);

		form.addEventListener("submit", async function (event) {
			event.preventDefault();
			event.stopPropagation();
			setLoading(true);
			const formData = new FormData(event.target);

			const { username, password } = Object.fromEntries(formData.entries());

			await apiCaller.validateLogin(username, password, (contracts) => {
				renderContracts(contracts);
			});
			setLoading(false);
		});

		const renderContracts = (contracts) => {
			setStage(2);

			const contractMarkup = ({ contract }) => {
				return `
                <label class="radio-label">
                    <input type="radio" value="${contract.id}" name="contractId" required />
                    <h4>ID: ${contract.id}</h4>
                    <p>${contract.ware.text}</p>
                </label>
                `;
			};

			const constractsWrapper = contractForm.querySelector(".contracts");
			if (contracts.length) {
				constractsWrapper.innerHTML = contracts.map((data) => contractMarkup(data));
			} else {
				constractsWrapper.innerText = `Det ser ikke ut som at du har noen aktive parkeringsavtaler for øyeblikket. Så her er det lite vi får gjort :/`;
				constractsWrapper.classList.add("no-contracts");
				contractForm.querySelector(".button").setAttribute("disabled", "");
			}
		};

		contractForm.addEventListener("submit", async function (event) {
			event.preventDefault();
			event.stopPropagation();
			setLoading(true);
			const formData = new FormData(event.target);

			const { contractId } = Object.fromEntries(formData.entries());

			await apiCaller.generateApiKey(contractId, renderApiKey);
			setLoading(false);
		});

		const renderApiKey = (apiKey) => {
			document.querySelector("#innopark-apiKey").innerHTML = apiKey;
			setStage(3);
		};

		document.querySelector("#api-key-copy").addEventListener("click", async function (event) {
			event.preventDefault();

			const apiKey = document.querySelector("#innopark-apiKey").innerText;

			try {
				await navigator.clipboard.writeText(apiKey);
				this.classList.add("copied");

				setTimeout(() => {
					this.classList.remove("copied");
				}, 2000);
			} catch (err) {
				console.error("Error copying API key:", err);
			}
		});
	}
};
