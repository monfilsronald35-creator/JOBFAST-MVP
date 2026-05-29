import React, { memo } from "react";
import Navbar from "./Navbar";

// Kalkile yon sèl fwa nan nivo modil la
const CURRENT_YEAR = new Date().getFullYear();

// ======================================================
// 🌍 JOBFAST — FOOTER (MEMOIZED)
// ======================================================
const Footer = memo(function Footer() {
  return (
    <footer style={styles.footer} aria-label="Footer information">
      <div style={styles.footerContainer}>
        <p style={styles.footerText}>
          📍 GPS Network • Nearby Jobs • Services On Demand
        </p>
        <p style={styles.copyright}>
          &copy; {CURRENT_YEAR} JOBFAST.RD — All rights reserved.
        </p>
      </div>
    </footer>
  );
});

// ======================================================
// 🚀 JOBFAST — MAIN LAYOUT (MEMOIZED)
// ======================================================
const MainLayout = memo(function MainLayout({ children }) {
  return (
    <div style={styles.app}>
      {/* GLOBAL NAVBAR */}
      <Navbar />

      {/* DYNAMIC CONTENT */}
      <main style={styles.main} role="main">
        {children}
      </main>

      {/* GLOBAL FOOTER */}
      <Footer />
    </div>
  );
});

export default MainLayout;

// ======================================================
// 🎨 IMMUTABLE DESIGN SYSTEM STYLES
// ======================================================
const styles = Object.freeze({
  app: {
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(to bottom, #020617, #0f172a)",
    color: "#ffffff",
    fontFamily: "Inter, Arial, sans-serif",
  },

  main: {
    flex: 1,
    padding: "24px 0",
    display: "flex",
    flexDirection: "column",
  },

  footer: {
    width: "100%",
    marginTop: "auto",
  },

  footerContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    textAlign: "center",
    padding: "16px 0",
  },

  footerText: {
    margin: 0,
    fontSize: "12px",
    fontWeight: "600",
    color: "#94a3b8",
    letterSpacing: "0.3px",
  },

  copyright: {
    margin: 0,
    fontSize: "11px",
    color: "#64748b",
  },
});
