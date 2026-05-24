import React, { useState } from "react";
import API from "../api/axios";

// ===============================
// 🚀 LOGIN PAGE (CONNECTED)
// ===============================

function Login() {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ===============================
  // 🔐 HANDLE LOGIN
  // ===============================

  const handleLogin = async () => {

    setError("");

    // VALIDATION
    if (!email || !password) {

      setError(
        "Please fill all fields"
      );

      return;
    }

    try {

      setLoading(true);

      // API CALL
      const res = await API.post(
        "/api/auth/login",
        {
          email,
          password,
        }
      );

      // RESPONSE
      const data = res.data;

      // SAVE TOKEN
      localStorage.setItem(
        "token",
        data.token
      );

      // SAVE USER
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      alert("Login successful");

      // REDIRECT
      window.location.href = "/";

    } catch (err) {

      console.error(err);

      setError(
        err?.response?.data
          ?.message ||
          "Login failed"
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

        {/* TITLE */}
        <h1 style={styles.title}>
          JOBFAST
        </h1>

        <p style={styles.subtitle}>
          Construction • Businesses •
          Services On Demand
        </p>

        {/* ERROR */}
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* EMAIL */}
        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        {/* PASSWORD */}
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleLogin();
            }
          }}
        />

        {/* BUTTON */}
        <button
          style={styles.button}
          onClick={() => {
            if (!loading) {
              handleLogin();
            }
          }}
          disabled={loading}
        >
          {loading
            ? "Logging in..."
            : "Login"}
        </button>

        {/* INFO */}
        <p style={styles.info}>
          Find workers, companies,
          services and jobs near you
        </p>

      </div>
    </div>
  );
}

// ===============================
// 🎨 STYLES
// ===============================

const styles = {

  container: {
    minHeight: "100vh",

    display: "flex",

    justifyContent: "center",

    alignItems: "center",

    background: "#0f172a",

    padding: "20px",

    fontFamily: "Arial",
  },

  card: {
    width: "100%",

    maxWidth: "360px",

    background: "#1e293b",

    padding: "24px",

    borderRadius: "14px",

    color: "white",

    boxShadow:
      "0 0 20px rgba(0,0,0,0.3)",
  },

  title: {
    fontSize: "28px",

    marginBottom: "6px",

    textAlign: "center",
  },

  subtitle: {
    fontSize: "13px",

    color: "#94a3b8",

    marginBottom: "20px",

    textAlign: "center",
  },

  error: {
    background: "#7f1d1d",

    color: "#fecaca",

    padding: "10px",

    borderRadius: "8px",

    marginBottom: "12px",

    fontSize: "13px",
  },

  input: {
    width: "100%",

    padding: "12px",

    marginBottom: "12px",

    borderRadius: "8px",

    border: "none",

    outline: "none",

    fontSize: "14px",
  },

  button: {
    width: "100%",

    padding: "12px",

    background: "#2563eb",

    border: "none",

    borderRadius: "8px",

    color: "white",

    fontSize: "15px",

    cursor: "pointer",
  },

  info: {
    marginTop: "14px",

    textAlign: "center",

    fontSize: "12px",

    color: "#94a3b8",
  },
};

export default Login;