import CryptoJS from "crypto-js";

export const encrypt = (string) => {
	return CryptoJS.AES.encrypt(string, process.env.AES_SECRET_KEY).toString();
};

export const decrypt = (string) => {
	const bytes = CryptoJS.AES.decrypt(string, process.env.AES_SECRET_KEY);
	return bytes.toString(CryptoJS.enc.Utf8);
};
