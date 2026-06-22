import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import { login } from "../services/auth";

// 🧠 Trankilite pou Vite: Nou kreye ti fonksyon lokal pou ranplase i18n ki te manke a
const getCurrentLanguage = () => "ht"; 

export default function Login() {
  const navigate = useNavigate();

  const mounted = useRef(false);
  const lastSubmit = useRef(0);

  const [formData, setFormData] = useState({
    identifier: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [langReady, setLangReady] = useState(false);

  /* INIT SAFE */
  useEffect(() => {
    mounted.current = true;
    // Sistèm nan tou pare enstantane piske nou inyore modil i18n ki kase a
    setLangReady(true); 

    return () => {
      mounted.current = false;
    };
  }, []);

  /* INPUT */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((p) => ({
      ...p,
      [name]: value ?? ""
    }));

    if (error) setError("");
  };

  /* VALIDATION */
  const isValidEmail = (v = "") =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const isValidPhone = (v = "") =>
    /^[0-9+\s]{6,15}$/.test(v);

  /* SUBMIT SAFE */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mounted.current) return;

    const now = Date.now();

    if (now - lastSubmit.current < 1500) return;
    lastSubmit.current = now;

    if (loading) return;

    const identifier = (formData.identifier || "").trim();
    const password = (formData.password || "").trim();

    if (!identifier || !password) {
      setError("Tanpri ranpli tout chan yo.");
      return;
    }

    const isEmail = isValidEmail(identifier);
    const isPhone = isValidPhone(identifier);

    if (!isEmail && !isPhone) {
      setError("Antre yon email oswa nimewo telefòn valid.");
      return;
    }

    if (typeof navigator !== "undefined" && navigator?.onLine === false) {
      setError("Pa gen koneksyon entènèt.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await login({
        email: isEmail ? identifier : undefined,
        phone: !isEmail ? identifier : undefined,
        password,
        lang: getCurrentLanguage()
      });

      const token = res?.token;

      if (!token) {
        setError("Repons sèvè pa valab.");
        return;
      }

      sessionStorage.setItem("token", token);

      if (mounted.current) navigate("/dashboard");

    } catch (err) {
      if (mounted.current) {
        setError(
          err?.response?.data?.message ||
          "Idantifyan oswa modpas pa kòrèk."
        );
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  /* LOADING */
  if (!langReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-text-muted">
        Loading system...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-bg px-6">

      <div className="text-center mb-8">
        <h2 className="text-xl font-black text-text">Byenveni</h2>
        <p className="text-sm text-text-muted mt-2">
          Konekte ak kont ou
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto flex flex-col gap-4">

        {error && (
          <div className="jf-card border-red-500/30 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <input
          name="identifier"
          value={formData.identifier}
          onChange={handleChange}
          placeholder="email oswa 509xxxx"
          autoComplete="username"
          className="jf-input"
        />

        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            autoComplete="current-password"
            className="jf-input pr-16"
          />

          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-3 text-xs text-text-muted"
          >
            {showPassword ? "Kache" : "Montre"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="text-xs text-primary text-right"
        >
          Ou bliye modpas?
        </button>

        <Button type="submit" variant="primary" loading={loading} className="w-full">
          Konekte
        </Button>

        <button
          type="button"
          onClick={() => navigate("/register")}
          className="text-sm text-primary mt-2"
        >
          Kreye kont
        </button>
      </form>
    </div>
  );
}
