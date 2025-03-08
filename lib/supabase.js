import { createClient } from "@supabase/supabase-js";
import { decrypt } from "./encryption.js";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_SERVICE_KEY);

export const getUserByApiKey = async (apiKey) => {
	const { data, error } = await supabase.from("users").select("*").eq("id", apiKey).limit(1);

	if (!data.length) {
		return null;
	}
	const user = data.shift();

	user.password = decrypt(user.password);

	return user;
};

export const request = async (apiKey, type) => {
	const { data, error } = await supabase.from("requests").insert({ user: apiKey, type: type });
};

export default supabase;
