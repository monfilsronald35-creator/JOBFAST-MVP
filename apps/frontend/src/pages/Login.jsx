import React, { useState } from "react";
import API from "../api/axios";

// ===============================
// 🚀 LOGIN PAGE (FINAL POLISH)
// ===============================

function Login() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

      localStorage.setItem("token", res.data.token);

      alert("Login successful");

      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h1 style={styles.title}>Login</h1>

        <p style={styles.subtitle}>
          Construction • Business • Services Platform
        </p>

        <input
          style={styles.input}
          placeholder="Email or Phone"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
            transform: loading ? "scale(0.98)" : "scale(1)",
          }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={styles.info}>
          Access workers, businesses, and services near you
        </p>

      </div>
    </div>
  );
}

// ===============================
// 🎨 FINAL PREMIUM STYLES
// ===============================

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(to bottom, #020617, #0f172a)",
    fontFamily: "Inter, Arial, sans-serif",
    padding: "20px",
  },

  card: {
    width: "100%",
    maxWidth: "380px",
    padding: "30px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(18px)",
    borderRadius: "20px",
    color: "white",
    boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
    transition: "all 0.3s ease",
  },

  title: {
    fontSize: "30px",
    fontWeight: "800",
    marginBottom: "6px",
  },

  subtitle: {
    fontSize: "13px",
    color: "#94a3b8",
    marginBottom: "22px",
  },

  input: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: "12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    outline: "none",
    background: "rgba(255,255,255,0.03)",
    color: "#fff",
    transition: "0.3s",
  },

  button: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(to right, #2563eb, #3b82f6)",
    border: "none",
    borderRadius: "12px",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
    transition: "0.3s",
  },

  info: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "14px",
    textAlign: "center",
  },
};

// ===============================
// 🔥 SMALL UX ENHANCEMENTS (IMPORTANT)
// ===============================

styles.input["onFocus"] = undefined; // React inline limitation note

export default Login;