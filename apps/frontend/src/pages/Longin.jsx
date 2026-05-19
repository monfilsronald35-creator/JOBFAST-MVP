 import React, { useState } from "react";
import API from "../api/axios";

// ===============================
// 🚀 LOGIN PAGE (MVP SAFE)
// ===============================

function Login() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ===============================
  // 🔐 HANDLE LOGIN
  // ===============================
  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/login", {
        emailOrPhone,
        password,
      });

      // Save token
      localStorage.setItem("token", res.data.token);

      alert("Login successful");

      // Redirect (future routing system)
      window.location.href = "/";

    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.message || "Login failed"
      );
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

        <h1 style={styles.title}>
          Login
        </h1>

        <p style={styles.subtitle}>
          Construction • Business • Services Platform
        </p>

        {/* EMAIL / PHONE */}
        <input
          style={styles.input}
          placeholder="Email or Phone"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
        />

        {/* PASSWORD */}
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* BUTTON */}
        <button
          style={styles.button}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* INFO */}
        <p style={styles.info}>
          Access workers, businesses, and services near you
        </p>

      </div>
    </div>
  );
}

// ===============================
// 🎨 STYLES (SIMPLE + SAFE)
// ===============================

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
    fontFamily: "Arial"
  },

  card: {
    width: "320px",
    padding: "20px",
    background: "#1e293b",
    borderRadius: "10px",
    color: "white"
  },

  title: {
    fontSize: "24px",
    marginBottom: "5px"
  },

  subtitle: {
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "15px"
  },

  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "none",
    outline: "none"
  },

  button: {
    width: "100%",
    padding: "10px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer"
  },

  info: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "10px",
    textAlign: "center"
  }
};

export default Login;