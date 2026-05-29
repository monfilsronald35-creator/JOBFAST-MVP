// ======================================================
// 🌍 src/pages/Register.jsx
// 🚀 JOBFAST GLOBAL — REGISTER
// ======================================================

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import API from "../api/axios";

// ======================================================
// 📦 STATIC CONFIG
// ======================================================

const CONSTRUCTION_ROLES = Object.freeze([
  "Mason",
  "Carpenter",
  "Electrician",
  "Plumber",
  "Painter",
  "Welder",
  "Engineer",
  "Assistant",
  "Boss",
]);

const BUSINESS_TYPES = Object.freeze([
  "Company",
  "Restaurant",
  "Hospital",
  "Clinic",
  "Hotel",
  "Office",
  "Lawyer",
  "Mechanic",
  "Tour Guide",
  "Organization",
]);

// ======================================================
// 🧠 HELPERS
// ======================================================

const normalize = (value = "") =>
  value.trim();

const isValidForm = ({
  fullName,
  emailOrPhone,
  password,
}) =>
  normalize(fullName).length >= 3 &&
  normalize(emailOrPhone).length >= 3 &&
  normalize(password).length >= 6;

// ======================================================
// 🚀 COMPONENT
// ======================================================

function Register() {

  const navigate =
    useNavigate();

  const [form, setForm] =
    useState({
      fullName: "",
      emailOrPhone: "",
      password: "",
      accountType: "worker",
      constructionRole: "",
      businessType: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ======================================================
  // ⏱ AUTO CLEAR ALERTS
  // ======================================================

  useEffect(() => {

    if (
      !errorMessage &&
      !success
    ) {
      return;
    }

    const timer =
      setTimeout(() => {

        setErrorMessage("");

        setSuccess("");

      }, 4000);

    return () =>
      clearTimeout(timer);

  }, [errorMessage, success]);

  // ======================================================
  // 🔄 UPDATE FIELD
  // ======================================================

  const updateField =
    useCallback((name, value) => {

      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));

    }, []);

  // ======================================================
  // 🔄 HANDLE CHANGE
  // ======================================================

  const handleChange =
    useCallback((event) => {

      const {
        name,
        value,
      } = event.target;

      // ======================================================
      // 🚫 PREVENT ONLY SPACE
      // ======================================================

      if (
        value.length === 1 &&
        value === " "
      ) {
        return;
      }

      updateField(name, value);

    }, [updateField]);

  // ======================================================
  // 🔄 ACCOUNT TYPE
  // ======================================================

  const handleAccountType =
    useCallback((event) => {

      const type =
        event.target.value;

      setForm((prev) => ({
        ...prev,
        accountType: type,
        constructionRole: "",
        businessType: "",
      }));

    }, []);

  // ======================================================
  // 🧠 VALIDATION
  // ======================================================

  const isDisabled = useMemo(() => {

    if (
      loading ||
      !isValidForm(form)
    ) {
      return true;
    }

    if (
      form.accountType ===
        "worker" &&
      !form.constructionRole
    ) {
      return true;
    }

    if (
      form.accountType ===
        "business" &&
      !form.businessType
    ) {
      return true;
    }

    return false;

  }, [form, loading]);

  // ======================================================
  // 🚀 REGISTER
  // ======================================================

  const handleRegister =
    useCallback(async () => {

      if (loading) {
        return;
      }

      if (isDisabled) {
        return;
      }

      setLoading(true);

      setErrorMessage("");

      setSuccess("");

      try {

        const payload = {
          fullName:
            normalize(
              form.fullName
            ),

          emailOrPhone:
            normalize(
              form.emailOrPhone
            ),

          password:
            normalize(
              form.password
            ),

          accountType:
            form.accountType,

          constructionRole:
            form.accountType ===
            "worker"
              ? form.constructionRole
              : "",

          businessType:
            form.accountType ===
            "business"
              ? form.businessType
              : "",
        };

        const res =
          await API.post(
            "/auth/register",
            payload
          );

        console.log(
          "✅ REGISTER SUCCESS:",
          res?.data
        );

        // ======================================================
        // 🔐 SAVE TOKEN
        // ======================================================

        if (
          res?.data?.token
        ) {

          localStorage.setItem(
            "token",
            res.data.token
          );

        }

        setSuccess(
          "Account created successfully"
        );

        // ======================================================
        // 🚀 REDIRECT
        // ======================================================

        setTimeout(() => {

          navigate("/");

        }, 1200);

      } catch (err) {

        console.error(err);

        setErrorMessage(
          err?.response?.data
            ?.message ||
          err?.message ||
          "Registration failed"
        );

      } finally {

        setLoading(false);
      }

    }, [
      form,
      isDisabled,
      loading,
      navigate,
    ]);

  // ======================================================
  // ⌨️ ENTER SUBMIT
  // ======================================================

  const handleKeyDown =
    useCallback((event) => {

      if (
        event.key === "Enter" &&
        !loading
      ) {
        handleRegister();
      }

    }, [
      handleRegister,
      loading,
    ]);

  // ======================================================
  // 🎨 UI
  // ======================================================

  return (
    <main style={styles.container}>
      <div style={styles.glow}></div>

      <section style={styles.card}>

        <h1 style={styles.title}>
          Create Account
        </h1>

        <p style={styles.subtitle}>
          Join workers,
          businesses &
          services worldwide
        </p>

        {/* FULL NAME */}

        <input
          type="text"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Full Name"
          autoComplete="name"
          aria-label="Full Name"
          style={styles.input}
        />

        {/* EMAIL / PHONE */}

        <input
          type="text"
          name="emailOrPhone"
          value={form.emailOrPhone}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Email or Phone"
          autoComplete="username"
          aria-label="Email or Phone"
          style={styles.input}
        />

        {/* PASSWORD */}

        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Password"
          autoComplete="new-password"
          aria-label="Password"
          style={styles.input}
        />

        {/* ACCOUNT TYPE */}

        <select
          value={form.accountType}
          onChange={
            handleAccountType
          }
          aria-label="Account Type"
          style={styles.input}
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

        {form.accountType ===
          "worker" && (
          <select
            value={
              form.constructionRole
            }
            onChange={(
              event
            ) =>
              updateField(
                "constructionRole",
                event.target.value
              )
            }
            aria-label="Construction Role"
            style={styles.input}
          >
            <option value="">
              Select Role
            </option>

            {CONSTRUCTION_ROLES.map(
              (role) => (
                <option
                  key={role}
                  value={role}
                >
                  {role}
                </option>
              )
            )}
          </select>
        )}

        {/* BUSINESS TYPE */}

        {form.accountType ===
          "business" && (
          <select
            value={
              form.businessType
            }
            onChange={(
              event
            ) =>
              updateField(
                "businessType",
                event.target.value
              )
            }
            aria-label="Business Type"
            style={styles.input}
          >
            <option value="">
              Select Business Type
            </option>

            {BUSINESS_TYPES.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              )
            )}
          </select>
        )}

        {/* ERROR */}

        {errorMessage && (
          <div style={styles.error}>
            {errorMessage}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div style={styles.success}>
            {success}
          </div>
        )}

        {/* BUTTON */}

        <button
          type="button"
          onClick={
            handleRegister
          }
          disabled={isDisabled}
          aria-busy={loading}
          style={{
            ...styles.button,

            opacity:
              isDisabled
                ? 0.7
                : 1,

            cursor:
              isDisabled
                ? "not-allowed"
                : "pointer",

            transform:
              loading
                ? "scale(0.98)"
                : "scale(1)",
          }}
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
            style={
              styles.loginLink
            }
          >
            Login
          </Link>
        </p>

      </section>
    </main>
  );
}

// ======================================================
// 🎨 STYLES
// ======================================================

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

    backdropFilter:
      "blur(18px)",

    WebkitBackdropFilter:
      "blur(18px)",

    borderRadius: "24px",

    overflow: "hidden",

    color: "#fff",

    boxShadow:
      "0 25px 60px rgba(0,0,0,0.45)",
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

    fontSize: "14px",

    transition:
      "all 0.3s ease",

    boxShadow:
      "0 0 0 rgba(59,130,246,0)",
  },

  button: {
    width: "100%",

    padding: "13px",

    background:
      "linear-gradient(to right, #22c55e, #16a34a)",

    border: "none",

    borderRadius: "12px",

    color: "#fff",

    fontWeight: "700",

    fontSize: "15px",

    transition:
      "all 0.3s ease",

    transform:
      "translateZ(0)",

    marginTop: "5px",
  },

  error: {
    marginBottom: "14px",

    padding: "12px",

    borderRadius: "12px",

    background:
      "rgba(239,68,68,0.15)",

    color: "#fca5a5",

    fontSize: "13px",
  },

  success: {
    marginBottom: "14px",

    padding: "12px",

    borderRadius: "12px",

    background:
      "rgba(34,197,94,0.15)",

    color: "#86efac",

    fontSize: "13px",
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

export default memo(Register);