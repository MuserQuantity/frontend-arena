import { createRoot } from "react-dom/client";
import App from "./App";
// Self-hosted variable fonts (wght 100–900), bundled by Vite — no CDN dependency.
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
