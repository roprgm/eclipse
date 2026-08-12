import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

function parsePort(value: string | undefined) {
	if (value === undefined) {
		return undefined;
	}

	const port = Number(value);
	if (!Number.isInteger(port) || port < 1 || port > 65_535) {
		throw new Error("PORT must be an integer between 1 and 65535");
	}

	return port;
}

export default defineConfig(({ mode }) => {
	const port = parsePort(loadEnv(mode, process.cwd(), "PORT").PORT);

	return {
		plugins: [react(), tailwindcss()],
		resolve: {
			alias: {
				"@": "/src",
			},
		},
		server: {
			port,
			strictPort: port !== undefined,
		},
	};
});
