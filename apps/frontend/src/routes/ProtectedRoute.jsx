// ======================================================
// 🌍 src/routes/ProtectedRoute.jsx
// 🚀 JOBFAST GLOBAL — PROTECTED ROUTE
// ======================================================

import React, {
  memo,
} from "react";

import {
  Navigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

// ======================================================
// 🎨 LOADER
// ======================================================

const FullScreenLoader =
  memo(function FullScreenLoader() {

    return (
      <div
        style={styles.center}
        role="status"
        aria-busy="true"
      >
        {/* SPINNER */}

        <div
          style={styles.spinner}
        />

        {/* TEXT */}

        <p style={styles.text}>
          Tanpri tann yon ti moman...
        </p>

        {/* KEYFRAMES */}

        <style>
          {`
            @keyframes jobfast-spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>
      </div>
    );
  });

// ======================================================
// 🚀 PROTECTED ROUTE
// ======================================================

function ProtectedRoute({
  children,
  fallback,
  redirectTo = "/login",
  replace = true,
}) {

  const {
    isAuthenticated,
    loading,
  } = useAuth();

  // ======================================================
  // ⏳ LOADING
  // ======================================================

  if (loading) {
    return (
      <FullScreenLoader />
    );
  }

  // ======================================================
  // 🚫 UNAUTHORIZED
  // ======================================================

  if (!isAuthenticated) {

    return (
      fallback ?? (
        <Navigate
          to={redirectTo}
          replace={replace}
        />
      )
    );
  }

  // ======================================================
  // ✅ AUTHORIZED
  // ======================================================

  return children || null;
}

// ======================================================
// 🎨 STYLES
// ======================================================

const styles = Object.freeze({
  center: {
    width: "100%",

    minHeight: "100dvh",

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",

    alignItems: "center",

    background:
      "linear-gradient(to bottom, #020617, #0f172a)",

    color: "#ffffff",

    fontFamily:
      "Inter, Arial, sans-serif",

    textAlign: "center",

    padding: "20px",
  },

  spinner: {
    width: "40px",

    height: "40px",

    border:
      "3px solid rgba(59,130,246,0.15)",

    borderTopColor:
      "#3b82f6",

    borderRadius: "50%",

    animation:
      "jobfast-spin 0.8s linear infinite",

    marginBottom: "16px",

    transform:
      "translateZ(0)",
  },

  text: {
    margin: 0,

    fontSize: "14px",

    fontWeight: "500",

    color: "#94a3b8",

    letterSpacing: "0.2px",
  },
});

export default memo(
  ProtectedRoute
);