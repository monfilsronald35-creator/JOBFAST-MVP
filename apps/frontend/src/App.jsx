import React from "react";

// ===============================
// 🚀 JOBFAST MVP MAIN APP (FINAL)
// ===============================

function App() {

  // ===============================
  // 🔥 TEMP BUTTON ACTIONS
  // ===============================

  const handleClick = (section) => {
    alert(`${section} feature coming soon 🚀`);
  };

  return (
    <div style={styles.container}>

      {/* ===============================
          🌍 HEADER
      =============================== */}

      <header style={styles.header}>
        <h1 style={styles.title}>
          JOBFAST Marketplace MVP
        </h1>

        <p style={styles.subtitle}>
          Construction • Services • Business Directory • Nearby GPS
        </p>
      </header>

      {/* ===============================
          🚀 MAIN GRID
      =============================== */}

      <main style={styles.grid}>

        {/* 👷 CONSTRUCTION */}
        <div style={styles.card}>
          <h2>👷 Construction</h2>

          <p>
            Boss • Mason • Electrician • Plumber • Carpenter • Engineer
          </p>

          <p style={styles.note}>
            🔴 Find skilled workers nearby
          </p>

          <button
            style={styles.button}
            onClick={() =>
              handleClick("Construction")
            }
          >
            Find Workers
          </button>
        </div>

        {/* 🏢 BUSINESS DIRECTORY */}
        <div style={styles.card}>
          <h2>🏢 Businesses</h2>

          <p>
            Hotel • Restaurant • Clinic • Company • Lawyer • Mechanic
          </p>

          <p style={styles.note}>
            🟢 Explore local businesses
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
          <h2>🚀 Services</h2>

          <p>
            Chef • Taxi • Nurse • Delivery • Cleaning • Videographer
          </p>

          <p style={styles.note}>
            ⚡ Request services instantly
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
          <h2>📍 Nearby GPS</h2>

          <p>
            GPS • Distance Search • Nearby Workers • Local Discovery
          </p>

          <p style={styles.note}>
            📡 Smart nearby location system
          </p>

          <button
            style={styles.button}
            onClick={() =>
              handleClick("Nearby GPS")
            }
          >
            Find Nearby
          </button>
        </div>

      </main>

      {/* ===============================
          ⚡ FOOTER
      =============================== */}

      <footer style={styles.footer}>
        © 2026 JOBFAST MVP — Global Marketplace Platform
      </footer>

    </div>
  );
}

// ===============================
// 🎨 MVP STYLES (SAFE FINAL)
// ===============================

const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    background: "#0f172a",
    color: "white",
    minHeight: "100vh"
  },

  header: {
    marginBottom: "30px"
  },

  title: {
    fontSize: "34px",
    fontWeight: "bold",
    marginBottom: "8px"
  },

  subtitle: {
    color: "#94a3b8",
    fontSize: "16px"
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px"
  },

  card: {
    background: "#1e293b",
    padding: "18px",
    borderRadius: "12px",
    boxShadow: "0 0 12px rgba(0,0,0,0.25)",
    transition: "0.3s"
  },

  button: {
    marginTop: "12px",
    padding: "10px 14px",
    border: "none",
    borderRadius: "6px",
    background: "#3b82f6",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%"
  },

  note: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "8px"
  },

  footer: {
    marginTop: "40px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "13px"
  }
};

export default App;