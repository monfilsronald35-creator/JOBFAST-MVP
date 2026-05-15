
import React from "react";

// ===============================
// 🚀 POST DETAILS (MVP SAFE)
// ===============================

function PostDetails() {
  // ===============================
  // 📦 MOCK POST (NO BACKEND NEEDED)
  // ===============================
  const post = {
    id: 1,
    title: "Need Mason in Bavaro",
    description:
      "Looking for an experienced mason for construction work in Bavaro area.",
    type: "construction",
    category: "Mason",
    status: "OPEN",
    location: "Bavaro, Punta Cana",
    distance: "2.5km",
    createdBy: "Ronald Monfils",
    phone: "+1 000 000 000",
    bio: "Experienced worker available for construction jobs.",
  };

  // 🔐 SAFE CHECK (evite crash si backend vini pita)
  if (!post) {
    return (
      <div style={styles.container}>
        <p style={styles.text}>Post not found</p>
      </div>
    );
  }

  // ===============================
  // 📞 CONTACT ACTION (MOCK ONLY)
  // ===============================
  const handleContact = () => {
    alert("Contact feature will connect to chat system later");
  };

  // ===============================
  // 🎨 UI
  // ===============================
  return (
    <div style={styles.container}>

      {/* CARD */}
      <div style={styles.card}>

        <h1 style={styles.title}>{post.title}</h1>

        <p style={styles.text}>{post.description}</p>

        <p style={styles.text}>Type: {post.type}</p>

        <p style={styles.text}>Category: {post.category}</p>

        <p style={styles.text}>
          📍 Location: {post.location} ({post.distance})
        </p>

        <p style={styles.text}>👤 Posted by: {post.createdBy}</p>

        <p style={styles.bio}>Bio: {post.bio}</p>

        {/* STATUS */}
        <span
          style={{
            ...styles.status,
            background: post.status === "OPEN" ? "#22c55e" : "#ef4444",
          }}
        >
          {post.status}
        </span>

        {/* ACTION */}
        <div style={styles.actions}>
          <button style={styles.button} onClick={handleContact}>
            Contact User
          </button>
        </div>

      </div>

      {/* INFO SECTION */}
      <div style={styles.card}>
        <h2>📍 Marketplace Info</h2>

        <p style={styles.text}>
          👷 Construction • 🏢 Business • 🚀 Services Network
        </p>

        <p style={styles.text}>
          GPS matching • Distance sorting • Nearby alerts
        </p>

        <p style={styles.note}>
          Future: chat system + real-time notifications + map integration
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
    marginBottom: "8px",
  },

  text: {
    fontSize: "13px",
    color: "#cbd5e1",
    marginBottom: "5px",
  },

  bio: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "8px",
  },

  status: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    color: "white",
    marginTop: "10px",
  },

  actions: {
    marginTop: "12px",
  },

  button: {
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
    marginTop: "10px",
  },
};

export default PostDetails;