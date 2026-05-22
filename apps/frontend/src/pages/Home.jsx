import React from "react";

// ===============================
// 🚀 HOME PAGE (MVP SAFE FINAL)
// ===============================

function Home() {

  // ===============================
  // 🔥 TEMP BUTTON ACTIONS
  // ===============================

  const handleClick = (section) => {
    alert(`${section} coming soon 🚀`);
  };

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <h1 style={styles.title}>
        JOBFAST Marketplace MVP
      </h1>

      <p style={styles.subtitle}>
        Construction • Businesses • Services On Demand • Nearby GPS
      </p>

      {/* GRID SECTIONS */}
      <div style={styles.grid}>

        {/* 👷 CONSTRUCTION */}
        <div style={styles.card}>
          <h2>👷 Construction Network</h2>

          <p>
            Boss • Assistant • Mason • Carpenter • Electrician • Plumber • Engineer
          </p>

          <p style={styles.note}>
            🔴 Availability: Working / Searching Job Toggle
          </p>

          <button
            style={styles.button}
            onClick={() =>
              handleClick("Construction Network")
            }
          >
            Find Construction Workers
          </button>
        </div>

        {/* 🏢 BUSINESS DIRECTORY */}
        <div style={styles.card}>
          <h2>🏢 Business Directory</h2>

          <p>
            Company • Restaurant • Hospital • Clinic • Hotel • Office • Lawyer • Mechanic • Tour Guide
          </p>

          <button
            style={styles.button}
            onClick={() =>
              handleClick("Business Directory")
            }
          >
            Explore Businesses
          </button>
        </div>

        {/* 🚀 SERVICES */}
        <div style={styles.card}>
          <h2>🚀 Services On Demand</h2>

          <p>
            Chef • Plumber • Doctor • Nurse • Taxi • Delivery • Cleaning • Videographer • Designer
          </p>

          <button
            style={styles.button}
            onClick={() =>
              handleClick("Services")
            }
          >
            Request Service
          </button>
        </div>

        {/* 📍 LOCATION */}
        <div style={styles.card}>
          <h2>📍 Location Engine</h2>

          <p>
            GPS • Distance Sorting • Nearby Search
          </p>

          <p style={styles.note}>
            🟢 Nearby user notifications system
          </p>

          <button
            style={styles.button}
            onClick={() =>
              handleClick("Nearby System")
            }
          >
            Find Nearby
          </button>
        </div>

      </div>
    </div>
  );
}

// ===============================
// 🎨 MVP STYLES
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
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "15px"
  },

  card: {
    background: "#1e293b",
    padding: "15px",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.2)"
  },

  button: {
    marginTop: "10px",
    padding: "10px 14px",
    border: "none",
    borderRadius: "6px",
    background: "#3b82f6",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold"
  },

  note: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "6px"
  }
};

export default Home;