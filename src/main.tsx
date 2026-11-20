import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./FireGuard";
import "./fireguard.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
