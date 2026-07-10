import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Self-contained i18n — intentionally not wired to react-i18next (ADR-006, Home is unrouted/legacy).
// Migrate to splash.* namespace when this route is activated in AppRoutes.
const TRANSLATIONS = {
  ht: {
    title: "JobFast",
    subtitle: "Travay. Sèvis. Biznis. Kote w ye.",
    description: "Tout nan yon sèl app.",
    start: "KÒMANSE",
    register: "Kreye Kont",
    login: "Login",
    langLabel: "Chwazi lang",
    features: [
      { id: "post",   icon: "📋", title: "Poste"    },
      { id: "search", icon: "🔍", title: "Chèche"   },
      { id: "fast",   icon: "⚡", title: "Rapid"    },
      { id: "secure", icon: "🔒", title: "Sekirize" },
    ],
  },
  en: {
    title: "JobFast",
    subtitle: "Jobs. Services. Businesses. Near you.",
    description: "All in one app.",
    start: "GET STARTED",
    register: "Create Account",
    login: "Log In",
    langLabel: "Choose language",
    features: [
      { id: "post",   icon: "📋", title: "Post"   },
      { id: "search", icon: "🔍", title: "Search" },
      { id: "fast",   icon: "⚡", title: "Fast"   },
      { id: "secure", icon: "🔒", title: "Safe"   },
    ],
  },
  es: {
    title: "JobFast",
    subtitle: "Trabajos. Servicios. Negocios.",
    description: "Todo en una sola app.",
    start: "EMPEZAR",
    register: "Crear Cuenta",
    login: "Entrar",
    langLabel: "Elegir idioma",
    features: [
      { id: "post",   icon: "📋", title: "Publicar" },
      { id: "search", icon: "🔍", title: "Buscar"   },
      { id: "fast",   icon: "⚡", title: "Rápido"   },
      { id: "secure", icon: "🔒", title: "Seguro"   },
    ],
  },
  fr: {
    title: "JobFast",
    subtitle: "Travaux. Services. Entreprises.",
    description: "Tout en une seule app.",
    start: "COMMENCER",
    register: "Créer un Compte",
    login: "Connexion",
    langLabel: "Choisir la langue",
    features: [
      { id: "post",   icon: "📋", title: "Publier" },
      { id: "search", icon: "🔍", title: "Trouver" },
      { id: "fast",   icon: "⚡", title: "Rapide"  },
      { id: "secure", icon: "🔒", title: "Sûr"     },
    ],
  },
};

const LANGS = ["ht", "en", "es", "fr"];

const LANG_LABELS = {
  ht: "Kreyòl",
  en: "English",
  es: "Español",
  fr: "Français",
};

export default function Home() {
  const navigate = useNavigate();
  const auth = useAuth();

  const isAuthenticated = auth?.isAuthenticated ?? false;
  const loading         = auth?.loading         ?? false;

  const [lang, setLang] = useState("ht");

  // SAFE REDIRECT — requestAnimationFrame prevents flicker and auth-loop.
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;

    const id = requestAnimationFrame(() => {
      navigate("/dashboard", { replace: true });
    });

    return () => cancelAnimationFrame(id);
  }, [isAuthenticated, loading, navigate]);

  const safeLang = useMemo(
    () => (LANGS.includes(lang) ? lang : "ht"),
    [lang]
  );

  const t = useMemo(() => TRANSLATIONS[safeLang], [safeLang]);

  const handleStart    = useCallback(() => navigate("/onboarding"), [navigate]);
  const handleLogin    = useCallback(() => navigate("/login"),      [navigate]);
  const handleRegister = useCallback(() => navigate("/register"),   [navigate]);

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading"
        className="min-h-screen flex items-center justify-center bg-navy-900"
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-gold-500/30 border-t-gold-500 animate-spin"
            aria-hidden="true"
          />
          <span className="text-slate-500 text-xs tracking-widest">JOBFAST</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-navy-900 px-5 text-white">
      <div className="w-full max-w-sm flex flex-col justify-between min-h-[85vh]">

        {/* ── Language selector ── */}
        <nav aria-label={t.langLabel}>
          <div
            role="group"
            aria-label={t.langLabel}
            className="flex bg-black/40 border border-slate-800/60 p-1 rounded-2xl mb-8"
          >
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-label={LANG_LABELS[l]}
                aria-pressed={safeLang === l}
                className={`
                  flex-1 py-1.5 text-[11px] font-black rounded-xl transition active:scale-95
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
                  ${safeLang === l
                    ? "bg-gold-500 text-black"
                    : "text-slate-400 hover:text-slate-200"
                  }
                `}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </nav>

        {/* ── Hero ── */}
        <div className="text-center my-auto flex flex-col items-center justify-center py-6">
          <div
            className="w-20 h-20 bg-navy-800 border-2 border-gold-500/20 rounded-3xl flex items-center justify-center text-4xl mb-5 shadow-lg shadow-black/40"
            aria-hidden="true"
          >
            👷‍♂️
          </div>

          <h1 className="text-4xl font-black uppercase tracking-tight">
            {t.title}<span className="text-gold-500">.</span>
          </h1>

          <p className="text-sm text-slate-300 mt-3 px-6 font-semibold leading-snug">
            {t.subtitle}
          </p>

          <p className="text-xs text-slate-500 mt-1.5">
            {t.description}
          </p>
        </div>

        {/* ── CTA buttons ── */}
        <div className="space-y-3 w-full mt-6">

          {/* Primary */}
          <button
            type="button"
            onClick={handleStart}
            className="
              w-full py-4 rounded-2xl bg-gold-500 text-black font-black text-xs
              tracking-widest active:scale-95 transition
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
              focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900
            "
          >
            {t.start}
          </button>

          {/* Secondary */}
          <button
            type="button"
            onClick={handleLogin}
            className="
              w-full py-4 rounded-2xl border border-slate-700 text-slate-300 font-bold
              text-xs uppercase tracking-wider active:scale-95 transition
              hover:border-slate-600 hover:text-white
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
            "
          >
            {t.login}
          </button>

          {/* Tertiary */}
          <button
            type="button"
            onClick={handleRegister}
            className="
              w-full py-2 text-xs text-slate-500 hover:text-slate-300
              active:scale-95 transition rounded-xl
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
            "
          >
            {t.register}
          </button>
        </div>

        {/* ── Feature pills ── */}
        <div className="grid grid-cols-4 gap-2 mt-8 border-t border-slate-800/40 pt-6">
          {t.features.map((f) => (
            <div key={f.id} className="flex flex-col items-center gap-1 text-center">
              <span className="text-base leading-none" aria-hidden="true">{f.icon}</span>
              <span className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                {f.title}
              </span>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
