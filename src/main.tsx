import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./providers/theme";
import "./styles/globals.css";

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<ThemeProvider>
			<App />
			<Toaster position="top-right" />
		</ThemeProvider>
	</StrictMode>,
);
