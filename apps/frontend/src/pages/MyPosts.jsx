import React, { useState } from "react";

// ===============================
// 🚀 MY POSTS (MVP SAFE)
// ===============================

function MyPosts() {
  // ===============================
  // 📦 MOCK POSTS (NO BACKEND NEEDED)
  // ===============================
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "Need Mason in Bavaro",
      type: "construction",
      category: "Mason",
      status: "OPEN",
      location: "Bavaro, Punta Cana",
      createdAt: "2026-05-07",
    },
    {
      id: 2,
      title: "Hotel Reception Job",
      type: "business",
      category: "Hotel",
      status: "OPEN",
      location: "Punta Cana",
      createdAt: "2026-05-06",
    },
    {
      id: 3,
      title: "Chef Lakay Needed",
      type: "service",
      category: "Chef",
      status: "CLOSED",
      location: "Veron",
      createdAt: "2026-05-05",
    },
  ]);

  // ===============================
  // 🗑 DELETE POST (MVP LOCAL ONLY)
  // ===============================
  const deletePost = (id) => {
    const filtered = posts.filter((post) => post.id !== id);
    setPosts(filtered);
  };

  // ===============================
  // 🎨 UI
  // ===============================
  return (
    <div style={styles.container}>

      {/* HEADER */}
      <h1 style={styles.title}>My Posts</h1>

      <p style={styles.subtitle}>
        Manage your Construction • Business • Service posts
      </p>

      {/* POSTS LIST */}
      <div style={styles.list}>

        {posts.length === 0 ? (
          <p style={styles.empty}>No posts available</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} style={styles.card}>

              <h3>{post.title}</h3>

              <p style={styles.text}>
                Type: {post.type}
              </p>

              <p style={styles.text}>
                Category: {post.category}
              </p>

              <p style={styles.text}>
                📍 {post.location}
              </p>

              <span
                style={{
                  ...styles.status,
                  background:
                    post.status === "OPEN" ? "#22c55e" : "#ef4444",
                }}
              >
                {post.status}
              </span>

              {/* ACTIONS */}
              <div style={styles.actions}>
                <button
                  style={styles.deleteBtn}
                  onClick={() => deletePost(post.id)}
                >
                  Delete
                </button>
              </div>

            </div>
          ))
        )}

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

  title: {
    fontSize: "26px",
    marginBottom: "5px",
  },

  subtitle: {
    fontSize: "13px",
    color: "#94a3b8",
    marginBottom: "15px",
  },

  list: {
    display: "grid",
    gap: "10px",
  },

  card: {
    background: "#1e293b",
    padding: "12px",
    borderRadius: "10px",
  },

  text: {
    fontSize: "13px",
    color: "#cbd5e1",
    marginBottom: "3px",
  },

  status: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    color: "white",
    marginTop: "6px",
  },

  actions: {
    marginTop: "10px",
  },

  deleteBtn: {
    padding: "6px 10px",
    background: "#ef4444",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
  },

  empty: {
    color: "#94a3b8",
    fontSize: "14px",
  },
};

export default MyPosts;