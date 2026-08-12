import { Analytics } from "@vercel/analytics/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { locale } from "./lib/i18n";

const root = document.getElementById("root");

if (!root) {
	throw new Error("Root element not found");
}

document.documentElement.lang = locale;

createRoot(root).render(
	<StrictMode>
		<App />
		<Analytics />
	</StrictMode>,
);
