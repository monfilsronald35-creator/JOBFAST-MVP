import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ===============================
// 🔄 LOADER ANIMATION
// ===============================

const loaderAnimation = `
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
`;

// ===============================
// 🚀 PROTECTED ROUTE
// ===============================

function ProtectedRoute({ children }) {

  const { user, loading } = useAuth();

  // ===============================
  // ⏳ LOADING
  // ===============================

  if (loading) {
    return (
      <>
        <style>{loaderAnimation}</style>

        <div style={styles.center}>

          <div style={styles.loader}></div>

          <h2 style={styles.title}>
            Loading...
          </h2>

          <p style={styles.text}>
            Please wait while we verify your session.
          </p>

        </div>
      </>
    );
  }

  // ===============================
  // 🚫 BLOCK ACCESS
  // ===============================

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // ===============================
  // ✅ ACCESS GRANTED
  // ===============================

  return children;
}

// ===============================
// 🎨 STYLES
// ===============================

const styles = {
  center: {
    width: "100%",
    minHeight: "100vh",

    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",

    padding: "20px",

    background: "#0f172a",
    color: "white",

    fontFamily: "Arial, sans-serif",
    textAlign: "center"
  },

  loader: {
    width: "55px",
    height: "55px",

    marginBottom: "20px",

    border: "5px solid #1e293b",
    borderTop: "5px solid #3b82f6",
    borderRadius: "50%",

    animation: "spin 1s linear infinite"
  },

  title: {
    fontSize: "24px",
    marginBottom: "8px"
  },

  text: {
    maxWidth: "300px",

    color: "#94a3b8",
    fontSize: "14px"
  }
};

export default ProtectedRoute;