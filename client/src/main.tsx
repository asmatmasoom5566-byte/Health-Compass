import { createRoot } from "react-dom/client";
import App from "./App";
import "./truly-identical.css";
import "./3d-enhancements.css";

// CRITICAL: Force clear cache and load from database
import "./force-database-load";

createRoot(document.getElementById("root")!).render(<App />);
