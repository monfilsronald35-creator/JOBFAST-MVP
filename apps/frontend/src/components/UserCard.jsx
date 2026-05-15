import React from "react";

// ===============================
// 🚀 USER CARD (MVP SAFE)
// ===============================

function UserCard({ user, onClick }) {
  if (!user) return null;

  const statusColor =
    user.status === "AVAILABLE"
      ? "#22c55e"
      : user.status === "BUSY"
      ? "#f59e0b"
      : "#ef4444";

  return (
    <div style={styles.card} onClick={onClick}>

      {/* NAME */}
      <h3 style={styles.name}>
        {user.fullName || user.name || "Unknown User"}
      </h3>

      {/* ROLE SYSTEM */}
      <p style={styles.role}>
        {user.role === "construction" && "👷 Construction Worker"}
        {user.role === "business" && "🏢 Business"}
        {user.role === "service" && "🚀 Service Provider"}
        {!user.role && "General User"}
      </p>

      {/* CATEGORY (very important for your system) */}
      {user.category && (
        <p style={styles.text}>
          🧩 {user.category}
        </p>
      )}

      {/* CONSTRUCTION SPECIAL (Boss / Assistant / Worker system) */}
      {user.role === "construction" && (
        <p style={styles.text}>
          🏗️ Construction Role: {user.constructionRole || "Worker"}
        </p>
      )}

      {/* BUSINESS TYPES */}
      {user.role === "business" && (
        <p style={styles.text}>
          🏢 Business Type: {user.businessType || "Company"}
        </p>
      )}

      {/* LOCATION + GPS READY */}
      <p style={styles.text}>
        📍 {user.location || "Unknown location"}
        {user.distance ? ` • ${user.distance}` : ""}
      </p>

      {/* BIO */}
      {user.bio && (
        <p style={styles.bio}>
          {user.bio}
        </p>
      )}

      {/* AVAILABILITY SYSTEM (CORE FEATURE) */}
      <div style={styles.statusBox}>
        <span style={{ ...styles.status, background: statusColor }}>
          {user.status || "UNKNOWN"}
        </span>
      </div>

      {/* ONLINE / BUSY INDICATOR */}
      {user.role === "construction" && (
        <div style={styles.availability}>
          {user.available === false
            ? "🔴 Not available for work"
            : "🟢 Available for work"}
        </div>
      )}

    </div>
  );
}

// ===============================
// 🎨 STYLES (MVP SAFE)
// ===============================
const styles = {
  card: {
    background: "#1e293b",
    padding: "12px",
    borderRadius: "10px",
    color: "white",
    cursor: "pointer",
    transition: "0.2s",
  },

  name: {
    fontSize: "16px",
    marginBottom: "5px",
  },

  role: {
    fontSize: "13px",
    color: "#94a3b8",
    marginBottom: "4px",
  },

  text: {
    fontSize: "13px",
    color: "#cbd5e1",
    marginBottom: "4px",
  },

  bio: {
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "6px",
  },

  statusBox: {
    marginTop: "6px",
  },

  status: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    color: "white",
  },

  availability: {
    marginTop: "8px",
    fontSize: "12px",
    color: "#cbd5e1",
  },
};

export default UserCard;