import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ======================================================
// 🎨 LOADER
// ======================================================
function FullScreenLoader() {
  return (
    <div style={styles.center} role="status" aria-busy="true">
      <div style={styles.spinner} />
      <p style={styles.text}>Tanpri tann yon ti moman...</p>
    </div>
  );
}

// ======================================================
// 🚀 PROTECTED ROUTE
// ======================================================
export default function ProtectedRoute({
  children,
  fallback,
  redirectTo = "/login",
  replace = true,
}) {
  const { isAuthenticated, loading } = useAuth();

  // ⏳ loading state
  if (loading) return <FullScreenLoader />;

  // 🚫 unauthorized access
  if (!isAuthenticated) {
    return fallback ?? (
      <Navigate to={redirectTo} replace={replace} />
    );
  }

  // ✅ authorized access
  return children ?? null;
}

// ======================================================
// 🎨 STYLES
// ======================================================
const styles = Object.freeze({
  center: {
    width: "100%",
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(to bottom, #020617, #0f172a)",
    color: "#ffffff",
    fontFamily: "Inter, Arial, sans-serif",
    textAlign: "center",
    padding: "20px",
  },

  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(59, 130, 246, 0.15)",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "jobfast-spin 0.8s linear infinite",
    marginBottom: "16px",
  },

  text: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "500",
    color: "#94a3b8",
    letterSpacing: "0.2px",
  },
});