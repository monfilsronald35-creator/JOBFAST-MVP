import React from "react";

// ===============================
// 🚀 POST CARD (MVP SAFE)
// ===============================

function PostCard({ post, onClick }) {
  if (!post) return null;

  const statusColor =
    post.status === "OPEN"
      ? "#22c55e"
      : post.status === "BUSY"
      ? "#f59e0b"
      : "#ef4444";

  return (
    <div style={styles.card} onClick={onClick}>

      {/* TITLE */}
      <h3 style={styles.title}>{post.title}</h3>

      {/* ROLE / CATEGORY */}
      <p style={styles.text}>
        {post.role || post.category || "General"}
      </p>

      {/* TYPE SYSTEM */}
      <p style={styles.type}>
        {post.type === "construction" && "👷 Construction"}
        {post.type === "business" && "🏢 Business"}
        {post.type === "service" && "🚀 Service"}
      </p>

      {/* LOCATION + DISTANCE (GPS READY UI) */}
      <p style={styles.text}>
        📍 {post.location} {post.distance ? `• ${post.distance}` : ""}
      </p>

      {/* USER INFO */}
      {post.name && (
        <p style={styles.user}>
          👤 {post.name}
        </p>
      )}

      {/* BIO */}
      {post.bio && (
        <p style={styles.bio}>
          {post.bio}
        </p>
      )}

      {/* STATUS (AVAILABLE / BUSY) */}
      <span style={{ ...styles.status, background: statusColor }}>
        {post.status || "UNKNOWN"}
      </span>

      {/* AVAILABILITY BADGE (Construction core feature) */}
      {post.type === "construction" && (
        <div style={styles.availability}>
          {post.available === false
            ? "🔴 Busy (Not Available)"
            : "🟢 Available for Work"}
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

  title: {
    fontSize: "16px",
    marginBottom: "5px",
  },

  text: {
    fontSize: "13px",
    color: "#cbd5e1",
    marginBottom: "4px",
  },

  type: {
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "4px",
  },

  user: {
    fontSize: "13px",
    color: "#e2e8f0",
    marginBottom: "4px",
  },

  bio: {
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "6px",
  },

  status: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    color: "white",
    marginTop: "5px",
  },

  availability: {
    marginTop: "8px",
    fontSize: "12px",
    color: "#cbd5e1",
  },
};

export default PostCard;