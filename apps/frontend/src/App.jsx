import React from "react";

// ===============================
// 🚀 MVP MAIN APP (SAFE)
// ===============================

function App() {
  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <h1 style={styles.title}>
        Marketplace MVP
      </h1>

      <p style={styles.subtitle}>
        Construction • Services • Business Directory
      </p>

      {/* MAIN SECTIONS */}
      <div style={styles.grid}>

        {/* 👷 CONSTRUCTION */}
        <div style={styles.card}>
          <h2>👷 Construction</h2>
          <p>Boss • Mason • Electrician • Plumber</p>
          <button style={styles.button}>Find Workers</button>
        </div>

        {/* 🏢 BUSINESS */}
        <div style={styles.card}>
          <h2>🏢 Businesses</h2>
          <p>Hotel • Restaurant • Clinic • Company</p>
          <button style={styles.button}>Explore</button>
        </div>

        {/* 🚀 SERVICES */}
        <div style={styles.card}>
          <h2>🚀 Services</h2>
          <p>Chef • Taxi • Nurse • Delivery</p>
          <button style={styles.button}>Request Service</button>
        </div>

        {/* 📍 LOCATION */}
        <div style={styles.card}>
          <h2>📍 Nearby</h2>
          <p>GPS • Distance • Map search</p>
          <button style={styles.button}>Find Nearby</button>
        </div>

      </div>
    </div>
  );
}

// ===============================
// 🎨 SIMPLE MVP STYLES
// ===============================

const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial",
    background: "#0f172a",
    color: "white",
    minHeight: "100vh"
  },

  title: {
    fontSize: "28px",
    marginBottom: "5px"
  },

  subtitle: {
    color: "#94a3b8",
    marginBottom: "20px"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px"
  },

  card: {
    background: "#1e293b",
    padding: "15px",
    borderRadius: "10px"
  },

  button: {
    marginTop: "10px",
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    background: "#3b82f6",
    color: "white",
    cursor: "pointer"
  }
};

export default App;
