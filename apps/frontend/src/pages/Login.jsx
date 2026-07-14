import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import { login } from "../services/auth";
import { useAuth } from "../context/AuthContext";
import { getRoleDefaultPath } from "../config/roleConfig";
import { sounds } from "../utils/sounds";

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login: authLogin } = useAuth();

  const mounted = useRef(false);
  const lastSubmit = useRef(0);
  const slowTimer = useRef(null);
  const retryTimer = useRef(null);

  const [formData, setFormData] = useState({
    identifier: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [slowLoad, setSlowLoad] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [langReady, setLangReady] = useState(false);

  /* INIT SAFE */
  useEffect(() => {
    mounted.current = true;
    setLangReady(true);
    return () => {
      mounted.current = false;
      clearTimeout(slowTimer.current);
      clearTimeout(retryTimer.current);
    };
  }, []);

  useEffect(() => {
    clearTimeout(slowTimer.current);
    if (loading) {
      slowTimer.current = setTimeout(() => {
        if (mounted.current) setSlowLoad(true);
      }, 8000);
    } else {
      setSlowLoad(false);
    }
  }, [loading]);

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
        sounds.error();
        if (status === 503 || status === 0 || !status) {
          // Server sleeping — stay in loading mode, auto-retry in 20s
          setSlowLoad(true);
          clearTimeout(retryTimer.current);
          retryTimer.current = setTimeout(async () => {
            if (!mounted.current) return;
            // Auto-retry the same credentials
            try {
              const retry = await login({
                email: isEmail ? identifier : undefined,
                phone: !isEmail ? identifier : undefined,
                password,
                lang: t("common.lang") || "ht"
              });
              if (!mounted.current) return;
              if (retry?.success) {
                const token = retry?.data?.data?.token || retry?.data?.token || retry?.token;
                const u     = retry?.data?.data?.user  || retry?.data?.user  || retry?.user;
                if (token && u) {
                  if (u?.id && !u?._id) u._id = u.id;
                  authLogin({ ...u, token });
                  try { sounds.login(); } catch (_) {}
                  navigate(getRoleDefaultPath(u?.role));
                  return;
                }
              }
            } catch (_) {}
            if (mounted.current) {
              setLoading(false);
              setSlowLoad(false);
              setError("Sèvè a poko leve. Eseye ankò nan 30 sègonn.");
            }
          }, 20000);
          return; // Stay in loading state while retrying — don't fall through to finally
        } else if (status === 401) {
          setError(t("auth.invalidCredentials"));
        } else {
          setError(res?.message || t("auth.invalidCredentials"));
        }
        if (mounted.current) setLoading(false);
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
      try { sounds.login(); } catch (_) {}

      if (mounted.current) navigate(getRoleDefaultPath(user?.role));

    } catch (err) {
      if (mounted.current) {
        setLoading(false);
        setError(
          err?.response?.data?.message ||
          err?.message ||
          t("auth.invalidCredentials")
        );
      }
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
    <div className="min-h-screen flex flex-col justify-center bg-navy-900 px-6 relative">

      {/* Cold-start overlay */}
      {loading && slowLoad && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050B18]/90 backdrop-blur-sm px-8 text-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-amber-400/30 border-t-amber-400 animate-spin" />
          <p className="text-base font-black text-white">Sèvè a ap reveye...</p>
          <p className="text-xs text-slate-400 max-w-xs">
            Sèvè gratuit la dòmi apre 15 min inaktivite. Tann 30 sègonn — li pral bon!
          </p>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      )}

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
