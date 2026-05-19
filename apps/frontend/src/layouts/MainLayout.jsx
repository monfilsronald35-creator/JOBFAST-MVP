import React from "react";

// ===============================
// 🚀 MAIN LAYOUT (MVP SAFE)
// ===============================

function MainLayout({ children }) {
  return (
    <div style={styles.app}>

      {/* TOP NAVBAR AREA (simple placeholder, no dependency) */}
      <header style={styles.header}>
        <div style={styles.brand}>Marketplace MVP</div>

        <div style={styles.tags}>
          <span>👷 Construction</span>
          <span>🏢 Business</span>
          <span>🚀 Services</span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        {children}
      </main>

      {/* FOOTER (light MVP info only) */}
      <footer style={styles.footer}>
        <p>GPS Network • Nearby Jobs • Services On Demand</p>
      </footer>

    </div>
  );
}

// ===============================
// 🎨 STYLES (NO EXTERNAL FILES)
// ===============================
const styles = {
  app: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0f172a",
    color: "white",
    fontFamily: "Arial",
  },

  header: {
    padding: "12px 16px",
    borderBottom: "1px solid #1e293b",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  brand: {
    fontSize: "16px",
    fontWeight: "bold",
  },

  tags: {
    display: "flex",
    gap: "12px",
    fontSize: "12px",
    color: "#cbd5e1",
  },

  main: {
    flex: 1,
    padding: "15px",
  },

  footer: {
    padding: "10px",
    textAlign: "center",
    fontSize: "11px",
    color: "#94a3b8",
    borderTop: "1px solid #1e293b",
  },
};

export default MainLayout;