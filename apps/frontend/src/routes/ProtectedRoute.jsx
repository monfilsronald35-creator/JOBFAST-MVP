import React from "react";
import { useAuth } from "../context/AuthContext";

// ===============================
// 🚀 PROTECTED ROUTE (MVP SAFE)
// ===============================

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // ===============================
  // ⏳ LOADING STATE (SAFE)
  // ===============================
  if (loading) {
    return (
      <div style={styles.center}>
        <p>Loading...</p>
      </div>
    );
  }

  // ===============================
  // 🚫 NO USER → BLOCK ACCESS
  // ===============================
  if (!user) {
    return (
      <div style={styles.center}>
        <h2>Access Denied</h2>
        <p>You must be logged in to access this page.</p>
      </div>
    );
  }

  // ===============================
  // ✅ ALLOW ACCESS
  // ===============================
  return children;
}

// ===============================
// 🎨 STYLES (MVP SAFE)
// ===============================
const styles = {
  center: {
    width: "100%",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
    color: "white",
    fontFamily: "Arial",
    textAlign: "center",
    padding: "20px",
  },
};

export default ProtectedRoute;