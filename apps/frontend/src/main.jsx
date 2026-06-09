import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css"; // <--- Nou ranje liy sa a isit la!

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("[JOBFAST CRITICAL]: Objè '#root' la manke nan HTML la.");
  throw new Error("❌ Root element '#root' not found. Execution halted.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
