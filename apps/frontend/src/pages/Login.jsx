import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRoleDefaultPath } from "../config/roleConfig";
import { sounds } from "../utils/sounds";
import { login } from "../services/auth";
import { useLoginRateLimit } from "../hooks/useLoginRateLimit";
import { useAuthDeviceInfo } from "../hooks/useAuthDeviceInfo";
import { useRememberMe } from "../hooks/useRememberMe";
import { useOfflineStatus } from "../hooks/useOfflineStatus";
import { passwordStrengthScore, passwordStrengthColor } from "../utils/passwordStrength";
import { Eye, EyeOff, Lock, Mail, Phone, Loader2, WifiOff, ShieldAlert, ArrowRight } from "lucide-react";

const BG    = "#050B18";
const GOLD  = "#FACC15";

function StrengthBar({ score }) {
  if (!score) return null;
  const labels = ["", "Fèb", "Mwayen", "Bon", "Trè Fò"];
  const color  = passwordStrengthColor(score);
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? color : "rgba(255,255,255,0.08)" }} />
        ))}
      </div>
      <span className="text-[10px] font-bold" style={{ color }}>{labels[score]}</span>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const mounted    = useRef(false);
  const lastSubmit = useRef(0);
  const slowTimer  = useRef(null);
  const retryTimer = useRef(null);
  const abortRef   = useRef(null);
  const emailRef   = useRef(null);
  const passRef    = useRef(null);

  const [formData, setFormData] = useState({ identifier: "", password: "", remember: true });
  const [loading,  setLoading]  = useState(false);
  const [slowLoad, setSlowLoad] = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [pwScore,  setPwScore]  = useState(0);
  const [phase,    setPhase]    = useState("idle"); // idle | loading | success | error

  const { isOffline }                           = useOfflineStatus();
  const { deviceInfo }                          = useAuthDeviceInfo();
  const { canAttempt, registerFailure, resetFailures,
          isLocked, remainingLockSeconds, requiresCaptcha } = useLoginRateLimit();
  const { saveSession, loadRememberedIdentifier }           = useRememberMe();

  useEffect(() => {
    mounted.current = true;
    const remembered = loadRememberedIdentifier();
    if (remembered) {
      setFormData(p => ({ ...p, identifier: remembered }));
      setTimeout(() => passRef.current?.focus(), 100);
    } else {
      setTimeout(() => emailRef.current?.focus(), 100);
    }
    return () => {
      mounted.current = false;
      clearTimeout(slowTimer.current);
      clearTimeout(retryTimer.current);
      abortRef.current?.abort();
    };
  }, [loadRememberedIdentifier]);

  useEffect(() => {
    clearTimeout(slowTimer.current);
    if (loading) {
      slowTimer.current = setTimeout(() => {
        if (mounted.current) setSlowLoad(true);
      }, 7000);
    } else {
      setSlowLoad(false);
    }
  }, [loading]);

  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = v => /^[0-9+\s]{6,15}$/.test(v);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData(p => ({ ...p, [name]: val ?? "" }));
    if (name === "password") setPwScore(passwordStrengthScore(String(val)));
    if (error) setError("");
  };

  const handlePasswordKeyDown = e => {
    if (e.getModifierState) {
      const caps = e.getModifierState("CapsLock");
      if (caps !== capsLock) setCapsLock(caps);
    }
  };

  const doLogin = async ({ identifier, password }) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const payload = {
      email:    isEmail(identifier) ? identifier : undefined,
      phone:    !isEmail(identifier) ? identifier : undefined,
      password,
      device:   deviceInfo.device,
      browser:  deviceInfo.browser,
      os:       deviceInfo.os,
      timezone: deviceInfo.timezone,
      locale:   deviceInfo.locale,
    };
    return login(payload, { signal: controller.signal });
  };

  const handleSuccess = (user, token) => {
    if (!mounted.current) return;
    if (user?.id && !user?._id) user._id = user.id;
    authLogin({ ...user, token });
    saveSession({ remember: formData.remember, token, user });
    try { sounds.login(); } catch {}
    setPhase("success");
    setTimeout(() => navigate(getRoleDefaultPath(user?.role)), 600);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!mounted.current) return;

    const now = Date.now();
    if (now - lastSubmit.current < 800) return;
    lastSubmit.current = now;
    if (loading) return;

    if (isLocked) {
      setError(`Twòp esè. Tann ${remainingLockSeconds}s.`);
      return;
    }
    if (requiresCaptcha) {
      setError("Tanpri valide captcha a.");
      return;
    }

    const identifier = (formData.identifier || "").trim();
    const password   = (formData.password   || "").trim();

    if (!identifier || !password) { setError("Ranpli tout chan yo."); return; }
    if (!isEmail(identifier) && !isPhone(identifier)) {
      setError("Imèl oswa nimewo telefòn pa valab.");
      return;
    }
    if (isOffline) { setError("Pa gen koneksyon entènèt."); return; }

    setLoading(true);
    setError("");
    setPhase("loading");

    try {
      const res = await doLogin({ identifier, password });

      if (!res?.success) {
        registerFailure();
        try { sounds.error(); } catch {}
        const status = res?.status;
        if (status === 503 || status === 0 || !status) {
          setError("Sèvè a ap reveye. Tann kèk segond...");
        } else if (status === 401) {
          setError("Imèl / modpas pa kòrèk.");
        } else if (status === 423) {
          setError("Kont lan bloke. Kontakte sipò.");
        } else {
          setError(res?.message || "Imèl / modpas pa kòrèk.");
        }
        setLoading(false);
        setPhase("error");
        return;
      }

      resetFailures();
      const token = res?.data?.data?.token || res?.data?.token || res?.token;
      const user  = res?.data?.data?.user  || res?.data?.user  || res?.user;
      if (!token || !user) {
        setError("Repons sèvè a pa valab.");
        setLoading(false);
        setPhase("error");
        return;
      }

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

      handleSuccess(user, token);
    } catch (err) {
      if (!mounted.current) return;
      if (err?.name === "CanceledError" || err?.name === "AbortError") {
        setLoading(false);
        return;
      }
      setLoading(false);
      setPhase("error");
      setError(err?.response?.data?.message || err?.message || "Imèl / modpas pa kòrèk.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: BG }}>
      <style>{`
        @keyframes shine { 0%{transform:translateX(-60%)} 100%{transform:translateX(160%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseGold { 0%,100%{opacity:.6} 50%{opacity:1} }
        .login-card { animation: fadeUp .5s ease both; }
      `}</style>

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div style={{ position:"absolute", top:"-20%", left:"50%", transform:"translateX(-50%)",
          width:"640px", height:"640px", borderRadius:"50%",
          background:"radial-gradient(circle,rgba(250,204,21,.10) 0%,transparent 70%)", }} />
        <div style={{ position:"absolute", bottom:"-10%", right:"-10%",
          width:"400px", height:"400px", borderRadius:"50%",
          background:"radial-gradient(circle,rgba(96,165,250,.07) 0%,transparent 70%)", }} />
      </div>

      {/* Offline banner */}
      {isOffline && (
        <div className="relative z-20 flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold"
          style={{ background:"rgba(245,158,11,.12)", borderBottom:"1px solid rgba(245,158,11,.2)", color:"#fbbf24" }}>
          <WifiOff size={12} />
          Ou offline — verifye koneksyon ou a.
        </div>
      )}

      {/* Slow-load overlay */}
      {loading && slowLoad && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 text-center px-8"
          style={{ background:"rgba(5,11,24,.92)", backdropFilter:"blur(16px)" }}>
          <div className="w-14 h-14 rounded-full" style={{
            border:"3px solid rgba(250,204,21,.2)", borderTopColor: GOLD, animation:"spin 1s linear infinite"}} />
          <div>
            <p className="text-base font-black text-white">Sèvè a ap reveye…</p>
            <p className="text-xs mt-1 max-w-[240px] mx-auto" style={{ color:"#64748b" }}>
              Sèvè gratuit la dòmi apre kèk minit inaktivite. Tann kèk segond.
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full" style={{
                background: GOLD, animation:`bounce 1s ${i*.2}s ease-in-out infinite`}} />
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm login-card">

          {/* Logo */}
          <div className="text-center mb-10">
            <h1 className="text-[42px] font-black tracking-tight leading-none">
              <span style={{ color: GOLD }}>JOB</span>
              <span className="text-white">FAST</span>
            </h1>
            <p className="mt-3 text-sm" style={{ color:"#64748b" }}>
              Konekte ak kont ou pou kontinye
            </p>
          </div>

          {/* Card */}
          <div className="rounded-[28px] overflow-hidden"
            style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)",
              boxShadow:"0 32px 80px rgba(0,0,0,.5)", backdropFilter:"blur(24px)" }}>

            {/* Shimmer top bar */}
            <div className="h-[2px] w-full relative overflow-hidden">
              <div className="absolute inset-0"
                style={{ background:`linear-gradient(90deg,transparent,${GOLD},transparent)`,
                  animation:"shine 3s linear infinite" }} />
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4" noValidate>
              {/* Locked warning */}
              {isLocked && (
                <div className="flex items-center gap-2.5 rounded-[14px] p-3 text-xs font-bold"
                  style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.2)", color:"#f87171" }}>
                  <ShieldAlert size={14} className="shrink-0" />
                  Kont bloke {remainingLockSeconds}s akòz twòp esè.
                </div>
              )}

              {/* Error */}
              {error && !isLocked && (
                <div role="alert"
                  className="rounded-[14px] p-3 text-xs text-center font-bold"
                  style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.2)", color:"#f87171" }}>
                  {error}
                </div>
              )}

              {/* Identifier field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color:"#475569" }}>
                  Imèl oswa Telefòn
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:"#475569" }}>
                    {formData.identifier.includes("@") ? <Mail size={15} /> : <Phone size={15} />}
                  </div>
                  <input
                    ref={emailRef}
                    name="identifier"
                    type="text"
                    value={formData.identifier}
                    onChange={handleChange}
                    placeholder="imèl@ou.com oswa +509..."
                    autoComplete="username"
                    disabled={isLocked || loading}
                    className="w-full rounded-[14px] pl-10 pr-4 py-3.5 text-sm font-medium text-white placeholder:text-slate-600 outline-none transition-all"
                    style={{
                      background:"rgba(255,255,255,.05)",
                      border: error && !formData.identifier
                        ? "1.5px solid rgba(239,68,68,.5)"
                        : "1.5px solid rgba(255,255,255,.08)",
                    }}
                    onFocus={e => e.target.style.borderColor = GOLD + "60"}
                    onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,.08)"}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color:"#475569" }}>
                  Modpas
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:"#475569" }}>
                    <Lock size={15} />
                  </div>
                  <input
                    ref={passRef}
                    name="password"
                    type={showPass ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    onKeyDown={handlePasswordKeyDown}
                    placeholder="••••••••••"
                    autoComplete="current-password"
                    disabled={isLocked || loading}
                    className="w-full rounded-[14px] pl-10 pr-12 py-3.5 text-sm font-medium text-white placeholder:text-slate-600 outline-none transition-all"
                    style={{
                      background:"rgba(255,255,255,.05)",
                      border: error && !formData.password
                        ? "1.5px solid rgba(239,68,68,.5)"
                        : "1.5px solid rgba(255,255,255,.08)",
                    }}
                    onFocus={e => e.target.style.borderColor = GOLD + "60"}
                    onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,.08)"}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    aria-label={showPass ? "Kache" : "Montre"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition"
                    style={{ color:"#475569" }}
                    onMouseEnter={e => e.currentTarget.style.color="#94a3b8"}
                    onMouseLeave={e => e.currentTarget.style.color="#475569"}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* CapsLock hint */}
                {capsLock && (
                  <p className="text-[10px] font-bold" style={{ color:"#fbbf24" }}>
                    ⚠ Caps Lock aktif
                  </p>
                )}

                {/* Strength bar */}
                <StrengthBar score={pwScore} />
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setFormData(p => ({ ...p, remember: !p.remember }))}
                    className="w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer"
                    style={{
                      background: formData.remember ? GOLD : "rgba(255,255,255,.08)",
                      border: `1.5px solid ${formData.remember ? GOLD : "rgba(255,255,255,.15)"}`,
                    }}>
                    {formData.remember && <svg width="9" height="7" viewBox="0 0 9 7"><path d="M1 3.5L3.5 6L8 1" stroke="#050B18" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                  </div>
                  <span className="text-[11px] font-medium" style={{ color:"#64748b" }}>Sonje mwen</span>
                </label>

                <button type="button" onClick={() => navigate("/forgot-password")}
                  className="text-[11px] font-bold transition"
                  style={{ color: GOLD }}
                  onMouseEnter={e => e.currentTarget.style.opacity=".8"}
                  onMouseLeave={e => e.currentTarget.style.opacity="1"}>
                  Modpas bliye?
                </button>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || isLocked || isOffline}
                className="relative w-full overflow-hidden rounded-[14px] py-3.5 text-sm font-black transition-all active:scale-[.98] mt-2"
                style={{
                  background: loading || isLocked ? "rgba(250,204,21,.4)" : GOLD,
                  color: "#050B18",
                  boxShadow: loading || isLocked ? "none" : "0 8px 32px rgba(250,204,21,.25)",
                }}>
                {/* Shimmer on hover */}
                <span className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition"
                  style={{ background:"linear-gradient(115deg,transparent 30%,rgba(255,255,255,.25) 50%,transparent 70%)" }} />

                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Koneksyon…</>
                    : <>{phase === "success" ? "✓ Konekte!" : "Konekte"} <ArrowRight size={15} /></>}
                </span>
              </button>
            </form>

            {/* Bottom divider + register */}
            <div className="px-6 pb-6 flex flex-col items-center gap-3">
              <div className="flex items-center gap-3 w-full">
                <div className="flex-1 h-px" style={{ background:"rgba(255,255,255,.06)" }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color:"#334155" }}>oswa</span>
                <div className="flex-1 h-px" style={{ background:"rgba(255,255,255,.06)" }} />
              </div>

              <button type="button" onClick={() => navigate("/register")}
                className="w-full rounded-[14px] py-3.5 text-sm font-black transition-all active:scale-[.98]"
                style={{ background:"rgba(255,255,255,.04)", border:"1.5px solid rgba(255,255,255,.08)", color:"#94a3b8" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.16)"; e.currentTarget.style.color="#f8fafc"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.08)"; e.currentTarget.style.color="#94a3b8"; }}>
                Kreye yon kont
              </button>
            </div>
          </div>

          {/* Footer links */}
          <p className="text-center mt-6 text-[10px]" style={{ color:"#334155" }}>
            En continuyant, ou aksepte{" "}
            <button onClick={() => navigate("/terms")} className="underline hover:text-slate-400 transition">Tèm yo</button>
            {" "}ak{" "}
            <button onClick={() => navigate("/privacy")} className="underline hover:text-slate-400 transition">Konfidansyalite</button>.
          </p>
        </div>
      </div>
    </div>
  );
}
