
import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

// ===============================
// 🚀 REGISTER PAGE (GLOBAL FINAL)
// ===============================

function Register() {
  const [fullName, setFullName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

  const [accountType, setAccountType] =
    useState("worker");

  const [constructionRole, setConstructionRole] =
    useState("");

  const [businessType, setBusinessType] =
    useState("");

  const [loading, setLoading] = useState(false);

  // ===============================
  // 🔐 REGISTER
  // ===============================

  const handleRegister = async () => {
    if (
      !fullName.trim() ||
      !emailOrPhone.trim() ||
      !password.trim()
    ) {
      alert("Please fill all required fields");
      return;
    }

    if (
      accountType === "worker" &&
      !constructionRole
    ) {
      alert("Please select construction role");
      return;
    }

    if (
      accountType === "business" &&
      !businessType
    ) {
      alert("Please select business type");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        fullName: fullName.trim(),
        emailOrPhone: emailOrPhone.trim(),
        password,
        accountType,
        constructionRole:
          accountType === "worker"
            ? constructionRole
            : "",

        businessType:
          accountType === "business"
            ? businessType
            : "",
      };

      const res = await API.post(
        "/auth/register",
        payload
      );

      localStorage.setItem(
        "token",
        res.data.token
      );

      alert("Account created successfully");

      window.location.href = "/";

    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
        "Registration failed"
      );

    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // ⌨️ ENTER KEY
  // ===============================

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleRegister();
    }
  };

  // ===============================
  // 🔄 ACCOUNT TYPE SWITCH
  // ===============================

  const handleAccountType = (e) => {
    const type = e.target.value;

    setAccountType(type);

    setConstructionRole("");
    setBusinessType("");
  };

  // ===============================
  // 🎨 UI
  // ===============================

  return (
    <div style={styles.container}>
      <div style={styles.glow}></div>

      <div style={styles.card}>

        <h1 style={styles.title}>
          Create Account
        </h1>

        <p style={styles.subtitle}>
          Join workers, businesses &
          services worldwide
        </p>

        {/* FULL NAME */}
        <input
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChange={(e) =>
            setFullName(e.target.value)
          }
          onKeyDown={handleKeyDown}
        />

        {/* EMAIL / PHONE */}
        <input
          style={styles.input}
          placeholder="Email or Phone"
          value={emailOrPhone}
          onChange={(e) =>
            setEmailOrPhone(e.target.value)
          }
          onKeyDown={handleKeyDown}
        />

        {/* PASSWORD */}
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          onKeyDown={handleKeyDown}
        />

        {/* ACCOUNT TYPE */}
        <select
          style={styles.input}
          value={accountType}
          onChange={handleAccountType}
        >
          <option value="worker">
            👷 Construction Worker
          </option>

          <option value="business">
            🏢 Business
          </option>

          <option value="service">
            🚀 Service Provider
          </option>
        </select>

        {/* WORKER ROLE */}
        {accountType === "worker" && (
          <select
            style={styles.input}
            value={constructionRole}
            onChange={(e) =>
              setConstructionRole(
                e.target.value
              )
            }
          >
            <option value="">
              Select Role
            </option>

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

        {/* BUSINESS TYPE */}
        {accountType === "business" && (
          <select
            style={styles.input}
            value={businessType}
            onChange={(e) =>
              setBusinessType(
                e.target.value
              )
            }
          >
            <option value="">
              Select Business Type
            </option>

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
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading
              ? "not-allowed"
              : "pointer",

            transform: loading
              ? "scale(0.98)"
              : "scale(1)",
          }}
          onClick={handleRegister}
          disabled={loading}
        >
          {loading
            ? "Creating account..."
            : "Create Account"}
        </button>

        {/* LOGIN LINK */}
        <p style={styles.loginText}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={styles.loginLink}
          >
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}

// ===============================
// 🎨 GLOBAL GLASS UI
// ===============================

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    background:
      "linear-gradient(to bottom, #020617, #0f172a)",

    fontFamily:
      "Inter, Arial, sans-serif",

    padding: "20px",

    position: "relative",

    overflow: "hidden",
  },

  glow: {
    position: "absolute",
    inset: 0,

    background:
      "radial-gradient(circle at top, rgba(59,130,246,0.25), transparent 60%)",
  },

  card: {
    position: "relative",
    zIndex: 2,

    width: "100%",
    maxWidth: "400px",

    padding: "32px",

    background:
      "rgba(255,255,255,0.05)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    backdropFilter: "blur(18px)",

    borderRadius: "24px",

    color: "white",

    boxShadow:
      "0 25px 60px rgba(0,0,0,0.45)",

    transition: "0.3s",
  },

  title: {
    fontSize: "32px",
    fontWeight: "900",
    marginBottom: "6px",
  },

  subtitle: {
    fontSize: "13px",
    color: "#94a3b8",
    marginBottom: "22px",
    lineHeight: 1.6,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",

    padding: "13px 14px",

    marginBottom: "12px",

    borderRadius: "12px",

    border:
      "1px solid rgba(255,255,255,0.08)",

    outline: "none",

    background:
      "rgba(255,255,255,0.03)",

    color: "#fff",

    transition: "0.3s",
  },

  button: {
    width: "100%",

    padding: "13px",

    background:
      "linear-gradient(to right, #22c55e, #16a34a)",

    border: "none",

    borderRadius: "12px",

    color: "white",

    fontWeight: "700",

    fontSize: "15px",

    cursor: "pointer",

    transition: "0.3s",

    marginTop: "5px",
  },

  loginText: {
    marginTop: "18px",
    textAlign: "center",
    fontSize: "13px",
    color: "#94a3b8",
  },

  loginLink: {
    color: "#60a5fa",
    textDecoration: "none",
    fontWeight: "700",
  },
};

export default Register;