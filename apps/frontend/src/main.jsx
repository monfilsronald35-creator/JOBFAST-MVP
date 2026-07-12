import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";
import { initI18n } from "./i18n";

// Register Service Worker for PWA (offline + installability)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("[JOBFAST CRITICAL]: Objè '#root' la manke nan HTML la.");
  throw new Error("❌ Root element '#root' not found. Execution halted.");
}

// Initialize i18n before rendering
initI18n().then(() => {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch((error) => {
  console.error("Failed to initialize i18n:", error);
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
