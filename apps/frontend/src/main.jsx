import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";
import { initI18n } from "./i18n";

// Register Service Worker — Android, iPhone ak iPad
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Capture the current controller BEFORE registering so we can
    // distinguish a fresh install (no prior controller) from an upgrade.
    // On a fresh install, clients.claim() in the SW fires controllerchange
    // for the very first page load — reloading at that moment crashes React
    // on iOS Safari. We must only reload during an UPGRADE (prevController ≠ null).
    const prevController = navigator.serviceWorker.controller;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            // Only send SKIP_WAITING when upgrading an active controller,
            // not on the very first install (controller would be null then).
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(() => {});

    // Reload only when UPGRADING from an existing SW, never on fresh install.
    // Without this guard, the very first visit triggers a reload mid-render
    // which crashes the React app on iOS Safari.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing && prevController !== null) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element '#root' not found.");
}

// Initialize i18n before rendering
initI18n()
  .then(() => {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch(() => {
    // i18n failure is non-fatal — render with key fallbacks
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });