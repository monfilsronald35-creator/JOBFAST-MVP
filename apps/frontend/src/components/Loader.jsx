
import React from "react";

// ===============================
// 🚀 LOADER (CLEAN MVP SAFE)
// ===============================

function Loader() {
  return (
    <div style={styles.container}>

      <div style={styles.spinner}></div>

      <p style={styles.text}>Loading...</p>

      {/* Scoped animation (safe) */}
      <style>
        {`
          @keyframes loaderSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

    </div>
  );
}

// ===============================
// 🎨 STYLES
// ===============================
const styles = {
  container: {
    width: "100%",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
    color: "white",
    fontFamily: "Arial",
  },

  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #1e293b",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "loaderSpin 1s linear infinite",
  },

  text: {
    marginTop: "10px",
    fontSize: "14px",
    color: "#94a3b8",
  },
};

export default Loader;