import React, { useState } from "react";
import API from "../api/axios";

// ===============================
// 🚀 REGISTER PAGE (MVP SAFE)
// ===============================

function Register() {
  const [fullName, setFullName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

  // 🧠 TYPE OF ACCOUNT
  const [accountType, setAccountType] = useState("worker");

  // 👷 CONSTRUCTION ROLE
  const [constructionRole, setConstructionRole] = useState("");

  // 🏢 BUSINESS TYPE
  const [businessType, setBusinessType] = useState("");

  const [loading, setLoading] = useState(false);

  // ===============================
  // 🔐 HANDLE REGISTER
  // ===============================
  const handleRegister = async () => {
    if (!fullName || !emailOrPhone || !password) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/register", {
        fullName,
        emailOrPhone,
        password,
        accountType,
        constructionRole: accountType === "worker" ? constructionRole : "",
        businessType: accountType === "business" ? businessType : "",
      });

      localStorage.setItem("token", res.data.token);

      alert("Account created successfully");

      window.location.href = "/";

    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Registration failed");
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
          Register
        </h1>

        <p style={styles.subtitle}>
          Join Construction • Business • Services Network
        </p>

        {/* NAME */}
        <input
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

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

        {/* ACCOUNT TYPE */}
        <select
          style={styles.input}
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
        >
          <option value="worker">👷 Construction Worker</option>
          <option value="business">🏢 Business</option>
          <option value="service">🚀 Service Provider</option>
        </select>

        {/* 👷 CONSTRUCTION ROLES */}
        {accountType === "worker" && (
          <select
            style={styles.input}
            value={constructionRole}
            onChange={(e) => setConstructionRole(e.target.value)}
          >
            <option value="">Select Role</option>
            <option>Mason</option>
            <option>Carpenter</option>
            <option>Electrician</option>
            <option>Plumber</option>
            <option>Painter</option>
            <option>Welder</option>
            <option>Engineer</option>
            <option>Assistant</option>
            <option>Boss</option>
          </select>
        )}

        {/* 🏢 BUSINESS TYPES */}
        {accountType === "business" && (
          <select
            style={styles.input}
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
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

        {/* BUTTON */}
        <button
          style={styles.button}
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p style={styles.info}>
          By registering you join nearby workers, businesses & services network
        </p>

      </div>
    </div>
  );
}

// ===============================
// 🎨 STYLES (SAFE + SIMPLE)
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
    width: "340px",
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
    background: "#22c55e",
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

export default Register;