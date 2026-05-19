
import React, { useState } from "react";

// ===============================
// 🚀 CREATE POST (MVP SAFE)
// ===============================

function CreatePost() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // TYPE SYSTEM (Construction / Business / Service)
  const [type, setType] = useState("construction");

  // EXTRA CATEGORY
  const [category, setCategory] = useState("");

  const [loading, setLoading] = useState(false);

  // ===============================
  // 📦 HANDLE CREATE POST (MOCK SAFE)
  // ===============================
  const handleCreate = async () => {
    if (!title || !description) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      // 🧠 MVP ONLY (no backend crash protection)
      const newPost = {
        title,
        description,
        type,
        category,
        createdAt: new Date().toISOString(),
      };

      console.log("POST CREATED:", newPost);

      alert("Post created successfully (MVP)");

      // reset form
      setTitle("");
      setDescription("");
      setCategory("");

    } catch (err) {
      console.error(err);
      alert("Error creating post");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // 🎨 UI
  // ===============================
  return (
    <div style={styles.container}>

      <div style={styles.card}>

        <h1 style={styles.title}>Create Post</h1>

        <p style={styles.subtitle}>
          Construction • Businesses • Services On Demand
        </p>

        {/* TYPE SELECT */}
        <select
          style={styles.input}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="construction">👷 Construction</option>
          <option value="business">🏢 Business</option>
          <option value="service">🚀 Service</option>
        </select>

        {/* CATEGORY (DYNAMIC MVP) */}
        {type === "construction" && (
          <select
            style={styles.input}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select Construction Role</option>
            <option>Mason</option>
            <option>Carpenter</option>
            <option>Electrician</option>
            <option>Plumber</option>
            <option>Welder</option>
            <option>Engineer</option>
            <option>Boss</option>
            <option>Assistant</option>
          </select>
        )}

        {type === "business" && (
          <select
            style={styles.input}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select Business Type</option>
            <option>Company</option>
            <option>Restaurant</option>
            <option>Hospital</option>
            <option>Clinic</option>
            <option>Hotel</option>
            <option>Office</option>
            <option>Lawyer</option>
            <option>Mechanic</option>
            <option>Tour Guide</option>
            <option>Organization</option>
          </select>
        )}

        {type === "service" && (
          <select
            style={styles.input}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select Service</option>
            <option>Chef Lakay</option>
            <option>Plumber</option>
            <option>Doctor</option>
            <option>Nurse</option>
            <option>Taxi</option>
            <option>Delivery</option>
            <option>Cleaning</option>
            <option>Videographer</option>
            <option>Designer</option>
          </select>
        )}

        {/* TITLE */}
        <input
          style={styles.input}
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* DESCRIPTION */}
        <textarea
          style={styles.textarea}
          placeholder="Description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* BUTTON */}
        <button
          style={styles.button}
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Post"}
        </button>

        <p style={styles.note}>
          GPS + Nearby notifications will work when backend is connected
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
    maxWidth: "420px",
    margin: "0 auto",
    background: "#1e293b",
    padding: "15px",
    borderRadius: "10px",
  },

  title: {
    fontSize: "24px",
    marginBottom: "5px",
  },

  subtitle: {
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "15px",
  },

  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "none",
  },

  textarea: {
    width: "100%",
    padding: "10px",
    height: "80px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "none",
  },

  button: {
    width: "100%",
    padding: "10px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
  },

  note: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "10px",
    textAlign: "center",
  },
};

export default CreatePost;