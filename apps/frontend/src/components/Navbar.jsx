import React from "react";

// ===============================
// 🚀 NAVBAR (MVP SAFE)
// ===============================

function Navbar() {
  return (
    <div style={styles.navbar}>

      {/* LEFT - BRAND */}
      <div style={styles.brand}>
        Marketplace MVP
      </div>

      {/* CENTER - CATEGORIES */}
      <div style={styles.links}>
        <span style={styles.link}>👷 Construction</span>
        <span style={styles.link}>🏢 Business</span>
        <span style={styles.link}>🚀 Services</span>
        <span style={styles.link}>📍 Nearby</span>
      </div>

      {/* RIGHT - USER ACTIONS */}
      <div style={styles.actions}>
        <button style={styles.button}>
          Login
        </button>

        <button style={{ ...styles.button, background: "#22c55e" }}>
          Register
        </button>
      </div>

    </div>
  );
}

// ===============================
// 🎨 STYLES (MVP SAFE)
// ===============================
const styles = {
  navbar: {
    width: "100%",
    padding: "12px 16px",
    background: "#0f172a",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #1e293b",
    fontFamily: "Arial",
  },

  brand: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "white",
  },

  links: {
    display: "flex",
    gap: "15px",
    fontSize: "13px",
    color: "#cbd5e1",
  },

  link: {
    cursor: "pointer",
  },

  actions: {
    display: "flex",
    gap: "10px",
  },

  button: {
    padding: "6px 10px",
    border: "none",
    borderRadius: "6px",
    background: "#3b82f6",
    color: "white",
    cursor: "pointer",
    fontSize: "12px",
  },
};

export default Navbar;