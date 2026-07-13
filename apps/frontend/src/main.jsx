import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";
import { initI18n } from "./i18n";

// Register Service Worker — Android, iPhone ak iPad
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        // Detekte nouvo SW: pran kontwòl imedyatman san atann reload
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(() => {});

    // Reload paj la lè nouvo SW pran kontwòl (evite sèvi vye assets)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
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
