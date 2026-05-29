// ======================================================
// 🌍 src/pages/Login.jsx
// 🚀 JOBFAST GLOBAL — LOGIN
// ======================================================

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import API from "../api/axios";

// ======================================================
// 🧠 HELPERS
// ======================================================

const normalize = (value = "") =>
  value.trim();

const isValidForm = ({
  emailOrPhone,
  password,
}) =>
  normalize(emailOrPhone).length >= 3 &&
  normalize(password).length >= 6;

// ======================================================
// 🚀 COMPONENT
// ======================================================

function Login() {

  const navigate =
    useNavigate();

  const [form, setForm] =
    useState({
      emailOrPhone: "",
      password: "",
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
        name === "emailOrPhone" &&
        value.length === 1 &&
        value === " "
      ) {
        return;
      }

      updateField(name, value);

    }, [updateField]);

  // ======================================================
  // 🧠 VALIDATION
  // ======================================================

  const isDisabled = useMemo(
    () =>
      loading ||
      !isValidForm(form),

    [form, loading]
  );

  // ======================================================
  // 🚀 LOGIN
  // ======================================================

  const handleLogin =
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
          emailOrPhone:
            normalize(
              form.emailOrPhone
            ),

          password:
            normalize(
              form.password
            ),
        };

        const res =
          await API.post(
            "/auth/login",
            payload
          );

        console.log(
          "✅ LOGIN SUCCESS:",
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
          "Login successful"
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
          "Login failed"
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
    useCallback(
      (event) => {

        if (
          event.key === "Enter" &&
          !loading
        ) {
          handleLogin();
        }

      },
      [handleLogin, loading]
    );

  // ======================================================
  // 🎨 UI
  // ======================================================

  return (
    <main style={styles.container}>
      <section style={styles.card}>

        <h1 style={styles.title}>
          Login
        </h1>

        <p style={styles.subtitle}>
          Construction • Business •
          Services Platform
        </p>

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
          autoComplete="current-password"
          aria-label="Password"
          style={styles.input}
        />

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
          onClick={handleLogin}
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
            ? "Logging in..."
            : "Login"}
        </button>

        <p style={styles.info}>
          Access workers,
          businesses, and services
          near you
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
  },

  card: {
    width: "100%",

    maxWidth: "380px",

    padding: "30px",

    background:
      "rgba(255,255,255,0.05)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    backdropFilter:
      "blur(18px)",

    WebkitBackdropFilter:
      "blur(18px)",

    borderRadius: "20px",

    color: "#fff",

    overflow: "hidden",

    boxShadow:
      "0 25px 60px rgba(0,0,0,0.45)",
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

    lineHeight: 1.6,
  },

  input: {
    width: "100%",

    padding: "12px 14px",

    marginBottom: "12px",

    borderRadius: "12px",

    border:
      "1px solid rgba(255,255,255,0.08)",

    outline: "none",

    boxSizing: "border-box",

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

    padding: "12px",

    background:
      "linear-gradient(to right, #2563eb, #3b82f6)",

    border: "none",

    borderRadius: "12px",

    color: "#fff",

    fontWeight: "700",

    transition:
      "all 0.3s ease",

    transform:
      "translateZ(0)",
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

  info: {
    fontSize: "12px",

    color: "#94a3b8",

    marginTop: "14px",

    textAlign: "center",

    lineHeight: 1.6,
  },
};

export default memo(Login);