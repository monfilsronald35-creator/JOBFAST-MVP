// ======================================================
// 🌍 src/main.jsx
// 🚀 JOBFAST GLOBAL ENTRY POINT
// ======================================================

import React from "react";

import ReactDOM from "react-dom/client";

import App from "./App.jsx";

import "./styles/global.css";

// ======================================================
// 🧠 ROOT ELEMENT
// ======================================================

const rootElement =
  document.getElementById("root");

// ======================================================
// 🔐 ROOT SAFETY
// ======================================================

if (!rootElement) {

  throw new Error(
    "❌ Root element '#root' not found."
  );
}

// ======================================================
// 🚀 CREATE ROOT
// ======================================================

const root =
  ReactDOM.createRoot(
    rootElement
  );

// ======================================================
// 🚀 RENDER APP
// ======================================================

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);