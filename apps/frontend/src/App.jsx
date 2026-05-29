import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./routes/ProtectedRoute";

// ==============================
// 🚀 MAIN DASHBOARD
// ==============================
function MainDashboard() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Marketplace MVP</h1>
      <p style={styles.subtitle}>
        Construction • Services • Business Directory
      </p>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2>👷 Construction</h2>
          <p>Boss • Mason • Electrician • Plumber</p>
          <button style={styles.button}>Find Workers</button>
        </div>

        <div style={styles.card}>
          <h2>🏢 Businesses</h2>
          <p>Hotel • Restaurant • Clinic • Company</p>
          <button style={styles.button}>Explore</button>
        </div>

        <div style={styles.card}>
          <h2>🚀 Services</h2>
          <p>Chef • Taxi • Nurse • Delivery</p>
          <button style={styles.button}>Request Service</button>
        </div>

        <div style={styles.card}>
          <h2>📍 Nearby</h2>
          <p>GPS • Distance • Map search</p>
          <button style={styles.button}>Find Nearby</button>
        </div>
      </div>
    </div>
  );
}

// ==============================
// 🚀 APP ROUTER (FIXED)
// ==============================
function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected route */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// ==============================
// 🎨 STYLES
// ==============================
const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#0f172a", // better than background
    color: "white",
    minHeight: "100vh",
  },
  title: {
    fontSize: "28px",
    marginBottom: "5px",
  },
  subtitle: {
    color: "#94a3b8",
    marginBottom: "20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
  },
  card: {
    backgroundColor: "#1e293b",
    padding: "15px",
    borderRadius: "10px",
  },
  button: {
    marginTop: "10px",
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#3b82f6",
    color: "white",
    cursor: "pointer",
  },
};

export default App;