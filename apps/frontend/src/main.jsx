import React from "react";

import ReactDOM from "react-dom/client";

import App from "./App.jsx";

import "./styles/global.css";

// ======================================================
// 🌍 JOBFAST — ENTRY POINT
// ======================================================

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
    "[JOBFAST]: Root element '#root' not found."
  );
}

// ======================================================
// 🚀 APP ROOT
// ======================================================

ReactDOM.createRoot(
  rootElement
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);