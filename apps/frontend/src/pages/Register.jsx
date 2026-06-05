// ======================================================
// 🌍 src/pages/Register.jsx
// 🚀 JOBFAST GLOBAL — REGISTER (TAILWIND + ROLE CARD)
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
import RoleCard from "../components/RoleCard";

// ======================================================
// 📦 STATIC CONFIG (Wòl yo ak tout Emoji yo jan sa ye nan makèt la)
// ======================================================
const ROLES_LIST = Object.freeze([
  { id: "boss", label: "Boss", icon: "🤠" },
  { id: "worker", label: "Worker", icon: "👷‍♂️" },
  { id: "apprentice", label: "Apprentice", icon: "🧑‍🎓" },
  { id: "engineer", label: "Engineer", icon: "👨‍💼" },
  { id: "assistant", label: "Assistant", icon: "🧑‍💻" },
  { id: "client", label: "Client", icon: "🧑" },
]);

// ======================================================
// 🧠 HELPERS
// ======================================================
const normalize = (value = "") => value.trim();

const isValidForm = ({ fullName, emailOrPhone, password }) =>
  normalize(fullName).length >= 3 &&
  normalize(emailOrPhone).length >= 3 &&
  normalize(password).length >= 6;

// ======================================================
// 🚀 COMPONENT
// ======================================================
function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    emailOrPhone: "",
    password: "",
    accountType: "worker", // default kont kòmanse sou travayè
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState("");

  // ======================================================
  // ⏱ AUTO CLEAR ALERTS
  // ======================================================
  useEffect(() => {
    if (!errorMessage && !success) return;

    const timer = setTimeout(() => {
      setErrorMessage("");
      setSuccess("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [errorMessage, success]);

  // ======================================================
  // 🔄 UPDATE FIELD
  // ======================================================
  const updateField = useCallback((name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // ======================================================
  // 🔄 HANDLE CHANGE
  // ======================================================
  const handleChange = useCallback((event) => {
    const { name, value } = event.target;

    if (value.length === 1 && value === " ") {
      return;
    }

    updateField(name, value);
  }, [updateField]);

  // ======================================================
  // 🧠 VALIDATION
  // ======================================================
  const isDisabled = useMemo(() => {
    return loading || !isValidForm(form);
  }, [form, loading]);

  // ======================================================
  // 🚀 REGISTER ACTION
  // ======================================================
  const handleRegister = useCallback(async () => {
    if (loading || isDisabled) return;

    setLoading(true);
    setErrorMessage("");
    setSuccess("");

    try {
      const payload = {
        fullName: normalize(form.fullName),
        emailOrPhone: normalize(form.emailOrPhone),
        password: normalize(form.password),
        accountType: form.accountType,
      };

      const res = await API.post("/auth/register", payload);
      console.log("✅ REGISTER SUCCESS:", res?.data);

      if (res?.data?.token) {
        localStorage.setItem("token", res.data.token);
      }

      setSuccess("Account created successfully");

      setTimeout(() => {
        navigate("/");
      }, 1200);

    } catch (err) {
      console.error(err);
      setErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  }, [form, isDisabled, loading, navigate]);

  // ======================================================
  // ⌨️ ENTER SUBMIT
  // ======================================================
  const handleKeyDown = useCallback((event) => {
    if (event.key === "Enter" && !loading) {
      handleRegister();
    }
  }, [handleRegister, loading]);

  // ======================================================
  // 🎨 UI WITH TAILWIND (Fits perfectly with image_30.png)
  // ======================================================
  return (
    <main className="min-h-screen bg-navy-900 text-text-inverse flex flex-col justify-between p-6 font-sans relative overflow-hidden">
      {/* Efè limyè Radial nan background lan */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,136,229,0.15),transparent_60%)] pointer-events-none"></div>

      {/* Header ak bouton tounen nan Splash lan */}
      <div className="flex items-center justify-between pt-2 relative z-10 w-full max-w-sm mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="text-xl p-2 active:scale-95 transition-all text-text-muted hover:text-text-inverse"
          aria-label="Tounen"
        >
          ⬅️
        </button>
        <h1 className="text-lg font-display font-bold tracking-wide">Kreye Kont</h1>
        <div className="w-8"></div>
      </div>

      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center z-10 my-4">
        
        {/* TÈKS ENTWODIKSYON */}
        <div className="text-left mb-4">
          <p className="text-xs text-text-muted font-medium tracking-wide">Chwazi wòl ou</p>
        </div>

        {/* 🎛️ SEKSYON RÔLE CARD (GRID KONEKTE DIRÈK) */}
        <div className="grid grid-cols-3 gap-y-4 gap-x-2 justify-items-center w-full mb-6 bg-navy-900/50 p-1 rounded-2xl">
          {ROLES_LIST.map((item) => (
            <RoleCard
              key={item.id}
              title={item.label}
              icon={item.icon}
              selected={form.accountType === item.id}
              onClick={() => updateField("accountType", item.id)}
            />
          ))}
        </div>

        {/* ALÈT YO */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-danger-50 border border-danger-500/30 text-danger-500 text-xs text-center font-medium animate-fade-in">
            {errorMessage}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-success-50 border border-success-600/30 text-success-500 text-xs text-center font-medium animate-fade-in">
            {success}
          </div>
        )}

        {/* FÒM NAN NÈT */}
        <div className="flex flex-col gap-3">
          <input
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Non konplè"
            autoComplete="name"
            aria-label="Full Name"
            className="w-full bg-navy-800 border border-navy-700 rounded-xl py-4 px-4 text-sm text-text-inverse placeholder-text-muted focus:outline-none focus:border-brand-500 focus:shadow-glow transition-all"
          />

          <input
            type="text"
            name="emailOrPhone"
            value={form.emailOrPhone}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Nimewo telefòn oswa imèl"
            autoComplete="username"
            aria-label="Email or Phone"
            className="w-full bg-navy-800 border border-navy-700 rounded-xl py-4 px-4 text-sm text-text-inverse placeholder-text-muted focus:outline-none focus:border-brand-500 focus:shadow-glow transition-all"
          />

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Modpas"
            autoComplete="new-password"
            aria-label="Password"
            className="w-full bg-navy-800 border border-navy-700 rounded-xl py-4 px-4 text-sm text-text-inverse placeholder-text-muted focus:outline-none focus:border-brand-500 focus:shadow-glow transition-all"
          />

          {/* GWO BOUTON JÒN LAN (Kòrèk selon MVP) */}
          <button
            type="button"
            onClick={handleRegister}
            disabled={isDisabled}
            aria-busy={loading}
            className={`
              w-full font-display font-bold py-4 rounded-xl shadow-card text-sm tracking-wide mt-3 text-center transition-all duration-200
              ${isDisabled 
                ? "bg-gold-500/50 text-navy-900/60 cursor-not-allowed" 
                : "bg-gold-400 text-navy-900 active:scale-95 hover:bg-gold-300 cursor-pointer"}
            `}
          >
            {loading ? "Y ap kreye kont..." : "Kreye Kont"}
          </button>
        </div>
      </div>

      {/* LYEN LOGIN LAN NAN FON AN */}
      <p className="text-center text-xs text-text-muted mb-2 relative z-10">
        Deja gen kont?{" "}
        <Link to="/login" className="text-brand-400 hover:underline font-bold ml-1">
          Login
        </Link>
      </p>
    </main>
  );
}

export default memo(Register);
