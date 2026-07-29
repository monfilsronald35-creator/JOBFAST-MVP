import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useOfflineStatus } from "../hooks/useOfflineStatus";
import { useLoginRateLimit } from "../hooks/useLoginRateLimit";
import { useRememberMe } from "../hooks/useRememberMe";
import { login as performLoginApi } from "../services/auth";
import { sounds } from "../utils/sounds";
import { passwordStrengthScore } from "../utils/passwordStrength";
import { getRoleDefaultPath } from "../config/roleConfig";
import Input from "../components/Input";
import Button from "../components/Button";

const SLOW_LOAD_THRESHOLD_MS = 4000;

function LoginPage() {
  const navigate     = useNavigate();
  const { t, i18n } = useTranslation();
  const { login: authLogin } = useAuth();
  const offline      = useOfflineStatus();
  const { requiresCaptcha, registerFailure, resetFailures } = useLoginRateLimit();
  const { saveSession, loadRememberedIdentifier } = useRememberMe();

  const mounted     = useRef(true);
  const identifierRef = useRef(null);
  const passwordRef   = useRef(null);

  const [formData, setFormData] = useState({
    identifier: loadRememberedIdentifier(),
    password:   "",
    remember:   !!loadRememberedIdentifier(),
  });
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn,   setCapsLockOn]   = useState(false);
  const [slowLoad,     setSlowLoad]     = useState(false);
  const [langReady,    setLangReady]    = useState(i18n.isInitialized);

  const { identifier, password } = formData;
  const passwordScore = passwordStrengthScore(password);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!i18n.isInitialized) {
      const handler = () => setLangReady(true);
      i18n.on("initialized", handler);
      return () => i18n.off("initialized", handler);
    } else {
      setLangReady(true);
    }
  }, [i18n]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (error) setError("");
  }, [error]);

  const handlePasswordKeyDown = useCallback((e) => {
    setCapsLockOn(e.getModifierState?.("CapsLock") ?? false);
  }, []);

  const retryWithBackoff = useCallback(async (credentials, attempt) => {
    const delays = [2000, 5000, 10000];
    const delay  = delays[Math.min(attempt - 1, delays.length - 1)];

    if (!mounted.current) return;
    const timeoutId = window.setTimeout(() => {
      if (mounted.current) setSlowLoad(true);
    }, SLOW_LOAD_THRESHOLD_MS);

    await new Promise((resolve) => setTimeout(resolve, delay));
    window.clearTimeout(timeoutId);

    try {
      const res = await performLoginApi(credentials);
      if (res?.success) {
        const token = res?.data?.data?.token || res?.data?.token || res?.token;
        const user  = res?.data?.data?.user  || res?.data?.user  || res?.user;
        if (token && user) {
          if (user?.id && !user?._id) user._id = user.id;
          authLogin({ ...user, token });
          saveSession({ remember: formData.remember, token, user });
          try { sounds.login(); } catch (_) {}
          if (mounted.current) {
            setLoading(false);
            setSlowLoad(false);
            navigate(getRoleDefaultPath(user?.role));
          }
        }
      } else {
        if (mounted.current) {
          setSlowLoad(false);
          setLoading(false);
          setError(res?.message || t("auth.serverOffline") || "Sèvè a pa disponib. Eseye pita.");
        }
      }
    } catch {
      if (mounted.current) {
        setSlowLoad(false);
        setLoading(false);
        setError(t("auth.serverOffline") || "Sèvè a pa disponib. Eseye pita.");
      }
    }
  }, [authLogin, formData.remember, navigate, saveSession, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (offline.isOffline) {
      setError(t("errors.network") || "Pa gen koneksyon entènèt.");
      return;
    }

    if (requiresCaptcha) {
      setError(t("auth.captchaRequired") || "Tanpri valide captcha a.");
      return;
    }

    setLoading(true);
    setError("");

    const slowTimer = window.setTimeout(() => {
      if (mounted.current) setSlowLoad(true);
    }, SLOW_LOAD_THRESHOLD_MS);

    try {
      const res = await performLoginApi({ identifier, password });
      window.clearTimeout(slowTimer);

      if (!res?.success) {
        const status = res?.status;
        sounds.error();
        registerFailure();

        if (status === 503 || status === 0 || !status) {
          if (mounted.current) setSlowLoad(true);
          await retryWithBackoff({ identifier, password }, 1);
          return;
        } else if (status === 401) {
          setError(t("auth.invalidCredentials"));
        } else if (status === 423) {
          setError(t("auth.accountLocked") || "Kont lan bloke.");
        } else {
          setError(res?.message || t("auth.invalidCredentials"));
        }

        if (mounted.current) { setLoading(false); setSlowLoad(false); }
        return;
      }

      resetFailures();

      const token = res?.data?.data?.token || res?.data?.token || res?.token;
      const user  = res?.data?.data?.user  || res?.data?.user  || res?.user;

      if (!token || !user) {
        setError(t("errors.invalidResponse"));
        setLoading(false);
        return;
      }

      if (user?.id && !user?._id) user._id = user.id;

      if (user?.suspiciousLogin) {
        navigate("/verify-login", { state: { pendingUser: user, token } });
        setLoading(false);
        return;
      }

      if (user?.mfaRequired) {
        navigate("/2fa", { state: { pendingUser: user, token } });
        setLoading(false);
        return;
      }

      authLogin({ ...user, token });
      saveSession({ remember: formData.remember, token, user });

      try { sounds.login(); } catch (_) {}

      if (mounted.current) {
        setLoading(false);
        setSlowLoad(false);
        navigate(getRoleDefaultPath(user?.role));
      }
    } catch (err) {
      window.clearTimeout(slowTimer);
      if (!mounted.current) return;

      if (err?.name === "CanceledError" || err?.name === "AbortError") {
        setLoading(false);
        return;
      }

      setLoading(false);
      setSlowLoad(false);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          t("auth.invalidCredentials")
      );
    }
  };

  const handleFormKeyDown = (e) => {
    if (e.key === "Enter") {
      // form submit handles it
    }
  };

  if (!langReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900 text-slate-400">
        {t("app.loading")}
      </div>
    );
  }

  const passwordHints =
    passwordScore <= 1
      ? t("auth.passwordWeak") || "Mot de pase a twò fèb."
      : passwordScore === 2
      ? t("auth.passwordMedium") || "Mot de pase a mwayen."
      : t("auth.passwordStrong") || "Mot de pase a fò.";

  return (
    <div className="min-h-screen flex flex-col justify-center bg-navy-900 px-6 relative">
      {offline.isOffline && (
        <div className="absolute top-0 inset-x-0 z-20 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs text-center py-2 px-4">
          {t("errors.offline") ||
            "Ou offline kounye a. N ap eseye rekonekte otomatikman."}
        </div>
      )}

      {loading && slowLoad && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050B18]/90 backdrop-blur-sm px-8 text-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-amber-400/30 border-t-amber-400 animate-spin" />
          <p className="text-base font-black text-white">
            {t("auth.serverWakingUp") || "Sèvè a ap reveye..."}
          </p>
          <p className="text-xs text-slate-400 max-w-xs">
            {t("auth.serverSleepHint") ||
              "Sèvè gratuit la dòmi apre kèk min inaktivite. Tann kèk segond — li pral bon!"}
          </p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
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

      <form
        onSubmit={handleSubmit}
        onKeyDown={handleFormKeyDown}
        className="w-full max-w-sm mx-auto flex flex-col gap-4"
      >
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
          ref={identifierRef}
          name="identifier"
          value={formData.identifier}
          onChange={handleChange}
          placeholder={t("auth.emailOrPhone")}
          autoComplete="username"
          aria-label={t("auth.emailOrPhone")}
        />

        <div className="relative">
          <Input
            ref={passwordRef}
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            onKeyDown={handlePasswordKeyDown}
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

        {(capsLockOn || formData.password) && (
          <div className="flex justify-between items-center">
            {capsLockOn && (
              <span className="text-[10px] text-amber-400">
                {t("auth.capsLockOn") || "Caps Lock aktif."}
              </span>
            )}
            {formData.password && (
              <span className="ml-auto text-[10px] text-slate-400">
                {passwordHints}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-1">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              name="remember"
              checked={formData.remember}
              onChange={handleChange}
              className="rounded border-slate-600 text-amber-400 focus:ring-amber-400"
            />
            <span>{t("auth.rememberMe") || "Sonje mwen"}</span>
          </label>

          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-xs text-amber-400 hover:text-amber-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
          >
            {t("auth.forgotPassword")}
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          className="w-full mt-1"
        >
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

export default LoginPage;
