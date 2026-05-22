import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";

import "./styles/global.css";

// ========================================
// 🌍 JOBFAST — MVP ENTRY POINT (FINAL)
// ========================================

// ✅ SAFE ROOT CHECK
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("❌ Root element (#root) not found");
}

// ========================================
// 🚀 CREATE ROOT
// ========================================

const root = ReactDOM.createRoot(rootElement);

// ========================================
// 🚀 RENDER APPLICATION
// ========================================

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);