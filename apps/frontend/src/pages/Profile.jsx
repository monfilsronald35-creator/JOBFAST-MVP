import React, { useState } from "react";

// ===============================
// 🚀 PROFILE PAGE (MVP SAFE)
// ===============================

function Profile() {
  // ===============================
  // 👤 USER STATE (SIMPLIFIED MVP)
  // ===============================
  const [isAvailable, setIsAvailable] = useState(true);

  // Fake user (tanporè - backend ap ranplase li)
  const user = {
    fullName: "User Name",
    role: "Construction Worker",
    constructionRole: "Mason",
    businessType: "",
    serviceCategory: "",
    bio: "Available for work nearby jobs",
    location: "Punta Cana",
    distance: "2.5km",
  };

  // ===============================
  // 🔄 TOGGLE AVAILABILITY
  // ===============================
  const toggleAvailability = () => {
    setIsAvailable((prev) => !prev);
  };

  // ===============================
  // 🎨 UI
  // ===============================
  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.card}>
        <h1 style={styles.title}>{user.fullName}</h1>

        <p style={styles.text}>
          Role: {user.role}
        </p>

        {user.constructionRole && (
          <p style={styles.text}>
            Construction: {user.constructionRole}
          </p>
        )}

        {user.businessType && (
          <p style={styles.text}>
            Business: {user.businessType}
          </p>
        )}

        <p style={styles.text}>
          📍 Location: {user.location} ({user.distance})
        </p>

        <p style={styles.bio}>
          {user.bio}
        </p>
      </div>

      {/* AVAILABILITY STATUS */}
      <div style={styles.card}>

        <h2>Availability Status</h2>

        <div style={styles.statusBox}>
          <span
            style={{
              ...styles.status,
              background: isAvailable ? "#22c55e" : "#ef4444",
            }}
          >
            {isAvailable ? "AVAILABLE" : "BUSY"}
          </span>
        </div>

        <button
          style={styles.button}
          onClick={toggleAvailability}
        >
          {isAvailable ? "Set as Busy" : "Set as Available"}
        </button>

        <p style={styles.note}>
          🔔 When available = visible in nearby search
        </p>
      </div>

      {/* CATEGORY DISPLAY */}
      <div style={styles.card}>

        <h2>Categories</h2>

        <p style={styles.text}>
          👷 Construction • 🏢 Business • 🚀 Services
        </p>

        <p style={styles.note}>
          Users can be discovered by GPS, city, or skills
        </p>

      </div>

    </div>
  );
}

// ===============================
// 🎨 STYLES (MVP SAFE)
// ===============================

const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial",
    background: "#0f172a",
    minHeight: "100vh",
    color: "white",
  },

  card: {
    background: "#1e293b",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "15px",
  },

  title: {
    fontSize: "24px",
    marginBottom: "5px",
  },

  text: {
    fontSize: "14px",
    marginBottom: "5px",
    color: "#cbd5e1",
  },

  bio: {
    fontSize: "13px",
    color: "#94a3b8",
    marginTop: "8px",
  },

  statusBox: {
    marginTop: "10px",
    marginBottom: "10px",
  },

  status: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
    color: "white",
    display: "inline-block",
  },

  button: {
    marginTop: "10px",
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    background: "#3b82f6",
    color: "white",
    cursor: "pointer",
  },

  note: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "8px",
  },
};

export default Profile;