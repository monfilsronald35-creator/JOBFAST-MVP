// ======================================================
// 🌍 src/pages/Register.jsx
// 🚀 JOBFAST GLOBAL — REGISTER (ULTIMATE STABLE v5.2)
// ======================================================

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import RoleCard from "../components/RoleCard";

// ======================================================
// 📦 ROLES
// ======================================================
const ROLES_LIST = Object.freeze([
  { id: "boss", label: "Boss", icon: "🤠" },
  { id: "worker", label: "Worker", icon: "👷‍♂️" },
  { id: "apprentice", label: "Apprentice", icon: "🧑‍🎓" },
  { id: "engineer", label: "Engineer", icon: "👨‍💼" },
  { id: "assistant", label: "Assistant", icon: "🧑‍💻" },
  { id: "client", label: "Client", icon: "🧑" },
]);

const ALLOWED_ROLES = new Set(ROLES_LIST.map(r => r.id));

// ======================================================
// 🧠 HELPERS
// ======================================================
const normalize = (v) =>
  typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";

const isValidForm = (f) => {
  const fullName = normalize(f?.fullName);
  const emailOrPhone = normalize(f?.emailOrPhone);
  const password = normalize(f?.password);

  return (
    fullName.length >= 3 &&
    emailOrPhone.length >= 5 &&
    password.length >= 6
  );
};

// ======================================================
// 🚀 COMPONENT
// ======================================================
function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    emailOrPhone: "",
    password: "",
    accountType: "worker",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState("");

  const mountedRef = useRef(true);
  const abortRef = useRef(null);
  const requestId = useRef(0);
  const lastSubmitRef = useRef(0);

  const redirectTimer = useRef(null);
  const alertTimer = useRef(null);

  // ======================================================
  // CLEANUP
  // ======================================================
  useEffect(() => {
    return () => {
      mountedRef.current = false;

      abortRef.current?.abort();

      clearTimeout(redirectTimer.current);
      clearTimeout(alertTimer.current);
    };
  }, []);

  // ======================================================
  // AUTO CLEAR ALERTS
  // ======================================================
  useEffect(() => {
    if (!errorMessage && !success) return;

    clearTimeout(alertTimer.current);

    alertTimer.current = setTimeout(() => {
      if (mountedRef.current) {
        setErrorMessage("");
        setSuccess("");
      }
    }, 3500);

    return () => clearTimeout(alertTimer.current);
  }, [errorMessage, success]);

  // ======================================================
  // UPDATE FIELD (SAFE)
  // ======================================================
  const updateField = useCallback((name, value) => {
    setForm(prev => ({
      ...prev,
      [name]: typeof value === "string" ? value : "",
    }));
  }, []);

  const handleChange = useCallback((e) => {
    updateField(e.currentTarget.name, e.currentTarget.value);
  }, [updateField]);

  // ======================================================
  // DERIVED STATE
  // ======================================================
  const formValid = useMemo(() => isValidForm(form), [form]);
  const isDisabled = useMemo(() => loading || !formValid, [loading, formValid]);

  // ======================================================
  // REGISTER (HARDENED CORE)
  // ======================================================
  const handleRegister = useCallback(async () => {
    const now = Date.now();
    if (now - lastSubmitRef.current < 600) return;
    lastSubmitRef.current = now;

    if (isDisabled) return;

    // 🔒 SNAPSHOT LOCK (prevents mid-request mutation bugs)
    const snapshot = Object.freeze({
      fullName: normalize(form.fullName),
      emailOrPhone: normalize(form.emailOrPhone),
      password: normalize(form.password),
      accountType: ALLOWED_ROLES.has(form.accountType)
        ? form.accountType
        : "worker",
    });

    if (!isValidForm(snapshot)) return;

    setLoading(true);
    setErrorMessage("");
    setSuccess("");

    requestId.current += 1;
    const currentId = requestId.current;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await API.post(
        "/auth/register",
        snapshot,
        { signal: abortRef.current.signal }
      );

      if (!mountedRef.current || currentId !== requestId.current) return;

      if (res?.data?.token) {
        sessionStorage.setItem("token", res.data.token);
      }

      setSuccess(res?.data?.message || "Account created successfully");

      clearTimeout(redirectTimer.current);
      redirectTimer.current = setTimeout(() => {
        if (mountedRef.current) navigate("/");
      }, 900);

    } catch (err) {
      if (!mountedRef.current) return;

      if (err?.code === "ERR_CANCELED" || err?.name === "AbortError") return;

      setErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed"
      );
    } finally {
      if (mountedRef.current) setLoading(false);
      abortRef.current = null;
    }
  }, [form, isDisabled, navigate]);

  // ======================================================
  // ENTER HANDLER (STRICT CONTROL)
  // ======================================================
  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === "BUTTON") return; // avoid double submit

    if (e.key !== "Enter") return;
    if (isDisabled) return;

    e.preventDefault();
    handleRegister();
  }, [handleRegister, isDisabled]);

  // ======================================================
  // UI
  // ======================================================
  return (
    <main
      className="min-h-screen bg-navy-900 text-white flex flex-col justify-between p-6 relative overflow-hidden"
      onKeyDown={handleKeyDown}
    >

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,136,229,0.15),transparent_60%)] pointer-events-none" />

      <div className="flex items-center justify-between max-w-sm mx-auto w-full z-10">
        <button onClick={() => navigate(-1)} className="text-xl">⬅️</button>
        <h1 className="font-bold text-lg">Kreye Kont</h1>
        <div className="w-8" />
      </div>

      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center z-10">

        <div className="grid grid-cols-3 gap-2 mb-6">
          {ROLES_LIST.map(r => (
            <RoleCard
              key={r.id}
              title={r.label}
              icon={r.icon}
              selected={form.accountType === r.id}
              onClick={() => updateField("accountType", r.id)}
            />
          ))}
        </div>

        {errorMessage && <div className="mb-3 text-center text-xs text-red-400">{errorMessage}</div>}
        {success && <div className="mb-3 text-center text-xs text-green-400">{success}</div>}

        <div className="flex flex-col gap-3">

          <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Non konplè" className="p-3 rounded bg-navy-800" />

          <input name="emailOrPhone" value={form.emailOrPhone} onChange={handleChange} placeholder="Email oswa phone" className="p-3 rounded bg-navy-800" />

          <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Modpas" className="p-3 rounded bg-navy-800" />

          <button
            type="button"
            disabled={isDisabled}
            onClick={handleRegister}
            className={`p-4 rounded font-bold transition ${
              isDisabled
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-yellow-400 text-black active:scale-95"
            }`}
          >
            {loading ? "Y ap kreye kont..." : "Kreye Kont"}
          </button>

        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mb-2">
        Deja gen kont? <Link to="/login" className="text-blue-400 font-bold">Login</Link>
      </p>
    </main>
  );
}

export default memo(Register);