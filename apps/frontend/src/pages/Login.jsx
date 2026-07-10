import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import { login } from "../services/auth";
import { useAuth } from "../context/AuthContext";
import { getRoleDefaultPath } from "../config/roleConfig";

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login: authLogin } = useAuth();

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
      setError(t("auth.fillAllFields"));
      return;
    }

    const isEmail = isValidEmail(identifier);
    const isPhone = isValidPhone(identifier);

    if (!isEmail && !isPhone) {
      setError(t("auth.invalidEmailOrPhone"));
      return;
    }

    if (typeof navigator !== "undefined" && navigator?.onLine === false) {
      setError(t("errors.network"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await login({
        email: isEmail ? identifier : undefined,
        phone: !isEmail ? identifier : undefined,
        password,
        lang: t("common.lang") || "ht"
      });

      // services/auth.js returns { success, data, message, status } — never throws
      if (!res?.success) {
        const status = res?.status;
        if (status === 503 || status === 0 || !status) {
          setError(t("errors.serverWaking"));
        } else if (status === 401) {
          setError(t("auth.invalidCredentials"));
        } else {
          setError(res?.message || t("auth.invalidCredentials"));
        }
        return;
      }

      // Token is at res.data.data.token (backend wraps in data twice)
      const token = res?.data?.data?.token || res?.data?.token || res?.token;
      const user  = res?.data?.data?.user  || res?.data?.user  || res?.user;

      if (!token) {
        setError(t("errors.invalidResponse"));
        return;
      }

      if (user?.id && !user?._id) user._id = user.id;

      // Update AuthContext so AuthGate recognises the session immediately
      authLogin({ ...user, token });

      if (mounted.current) navigate(getRoleDefaultPath(user?.role));

    } catch (err) {
      if (mounted.current) {
        setError(
          err?.response?.data?.message ||
          err?.message ||
          t("auth.invalidCredentials")
        );
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  /* LOADING */
  if (!langReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900 text-slate-400">
        {t("app.loading")}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-navy-900 px-6">

      <div className="text-center mb-8">
        <h2 className="text-xl font-black text-white">{t("auth.welcome")}</h2>
        <p className="text-sm text-slate-400 mt-2">
          {t("auth.loginToAccount")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto flex flex-col gap-4">

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center p-3"
          >
            {error}
          </div>
        )}

        <Input
          name="identifier"
          value={formData.identifier}
          onChange={handleChange}
          placeholder={t("auth.emailOrPhone")}
          autoComplete="username"
          aria-label={t("auth.emailOrPhone")}
        />

        <div className="relative">
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            placeholder={t("auth.password")}
            autoComplete="current-password"
            aria-label={t("auth.password")}
            className="pr-14"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            aria-label={showPassword ? t("common.hide") : t("common.show")}
            className="absolute right-3 top-3 text-xs text-slate-400 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md px-1"
          >
            {showPassword ? t("common.hide") : t("common.show")}
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="text-xs text-amber-400 text-right hover:text-amber-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
        >
          {t("auth.forgotPassword")}
        </button>

        <Button type="submit" variant="primary" loading={loading} className="w-full">
          {t("auth.login")}
        </Button>

        <button
          type="button"
          onClick={() => navigate("/register")}
          className="text-sm text-amber-400 mt-2 hover:text-amber-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
        >
          {t("auth.createAccount")}
        </button>
      </form>
    </div>
  );
}
