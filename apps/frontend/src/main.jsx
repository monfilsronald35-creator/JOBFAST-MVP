import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";

import "./styles/global.css";

// ========================================
// 🌍 JOBFAST — MVP ENTRY POINT
// ========================================

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// ========================================
// 🚀 RENDER APP
// ========================================

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);