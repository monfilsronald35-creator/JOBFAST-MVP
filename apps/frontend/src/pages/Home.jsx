import React from "react";

// ===============================
// 🚀 HOME PAGE (MVP SAFE FINAL)
// ===============================

function Home() {
  return (
    <div style={styles.container}>

      {/* HEADER */}
      <h1 style={styles.title}>
        Marketplace MVP
      </h1>

      <p style={styles.subtitle}>
        Construction • Businesses • Services On Demand • Nearby GPS
      </p>

      {/* GRID SECTIONS */}
      <div style={styles.grid}>

        {/* 👷 CONSTRUCTION (CORE SYSTEM) */}
        <div style={styles.card}>
          <h2>👷 Construction Network</h2>
          <p>
            Boss • Assistant • Mason • Carpenter • Electrician • Plumber • Engineer
          </p>
          <p style={styles.note}>
            🔴 Availability: Working / Searching Job Toggle (future logic)
          </p>
          <button style={styles.button}>
            Find Construction Workers
          </button>
        </div>

        {/* 🏢 BUSINESS DIRECTORY */}
        <div style={styles.card}>
          <h2>🏢 Business Directory</h2>
          <p>
            Company • Restaurant • Hospital • Clinic • Hotel • Office • Lawyer • Mechanic • Tour Guide • Organization
          </p>
          <button style={styles.button}>
            Explore Businesses
          </button>
        </div>

        {/* 🚀 SERVICES ON DEMAND */}
        <div style={styles.card}>
          <h2>🚀 Services On Demand</h2>
          <p>
            Chef • Plumber • Doctor • Nurse • Taxi • Delivery • Cleaning • Videographer • Designer
          </p>
          <button style={styles.button}>
            Request Service
          </button>
        </div>

        {/* 📍 LOCATION ENGINE */}
        <div style={styles.card}>
          <h2>📍 Location Engine</h2>
          <p>
            GPS • Distance Sorting • City / State / Country • Nearby Search
          </p>
          <p style={styles.note}>
            🟢 Auto-notify nearby users when new job/service is posted
          </p>
          <button style={styles.button}>
            Find Nearby
          </button>
        </div>

      </div>
    </div>
  );
}

// ===============================
// 🎨 MVP STYLES (SIMPLE + SAFE)
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
    fontSize: "32px",
    marginBottom: "5px"
  },

  subtitle: {
    color: "#94a3b8",
    marginBottom: "25px"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "15px"
  },

  card: {
    background: "#1e293b",
    padding: "15px",
    borderRadius: "10px"
  },

  button: {
    marginTop: "10px",
    padding: "9px 12px",
    border: "none",
    borderRadius: "6px",
    background: "#3b82f6",
    color: "white",
    cursor: "pointer"
  },

  note: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "6px"
  }
};

export default Home;