import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const TRANSLATIONS = {
  ht: {
    title: "JobFast",
    subtitle: "Travay. Sèvis. Biznis. Kote w ye.",
    description: "Tout nan yon sèl app.",
    start: "KÒMANSE",
    register: "Kreye Kont",
    login: "Login",
    features: [
      { id: "post", title: "Poste" },
      { id: "search", title: "Chèche" },
      { id: "fast", title: "Rapid" },
      { id: "secure", title: "Sekirize" }
    ]
  },
  en: {
    title: "JobFast",
    subtitle: "Jobs. Services. Businesses. Near you.",
    description: "All in one app.",
    start: "GET STARTED",
    register: "Sign up",
    login: "Login",
    features: [
      { id: "post", title: "Post" },
      { id: "search", title: "Search" },
      { id: "fast", title: "Fast" },
      { id: "secure", title: "Safe" }
    ]
  },
  es: {
    title: "JobFast",
    subtitle: "Trabajos. Servicios. Negocios.",
    description: "Todo en una sola app.",
    start: "EMPEZAR",
    register: "Crear",
    login: "Entrar",
    features: [
      { id: "post", title: "Publicar" },
      { id: "search", title: "Buscar" },
      { id: "fast", title: "Rápido" },
      { id: "secure", title: "Seguro" }
    ]
  },
  fr: {
    title: "JobFast",
    subtitle: "Travaux. Services. Entreprises.",
    description: "Tout en une seule app.",
    start: "COMMENCER",
    register: "Créer",
    login: "Connexion",
    features: [
      { id: "post", title: "Publier" },
      { id: "search", title: "Trouver" },
      { id: "fast", title: "Rapide" },
      { id: "secure", title: "Sûr" }
    ]
  }
};

const LANGS = ["ht", "en", "es", "fr"];

export default function Home() {
  const navigate = useNavigate();
  const auth = useAuth();

  const isAuthenticated = auth?.isAuthenticated ?? false;
  const loading = auth?.loading ?? false;

  const [lang, setLang] = useState("ht");

  // SAFE REDIRECT (no loop, no flicker)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900 text-slate-400 text-xs">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-navy-900 px-5 text-white">
      <div className="w-full max-w-sm flex flex-col justify-between min-h-[85vh]">

        {/* LANGUAGE */}
        <div className="flex bg-black/40 border border-slate-800/60 p-1 rounded-2xl mb-8">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex-1 py-1.5 text-[11px] font-black rounded-xl transition active:scale-95 ${
                safeLang === l
                  ? "bg-gold-500 text-black"
                  : "text-slate-400"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* HEADER */}
        <div className="text-center my-auto flex flex-col items-center justify-center py-6">
          <div className="w-20 h-20 bg-navy-800 border-2 border-gold-500/20 rounded-3xl flex items-center justify-center text-4xl mb-5">
            👷‍♂️
          </div>

          <h1 className="text-4xl font-black uppercase">
            {t.title}<span className="text-gold-500">.</span>
          </h1>

          <p className="text-sm text-slate-300 mt-2 px-6 font-semibold">
            {t.subtitle}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            {t.description}
          </p>
        </div>

        {/* BUTTONS */}
        <div className="space-y-3 w-full mt-6">
          <button
            onClick={() => navigate("/onboarding")}
            className="w-full py-4 rounded-2xl bg-gold-500 text-black font-black text-xs active:scale-95 transition"
          >
            {t.start}
          </button>

          <button
            onClick={() => navigate("/login")}
            className="w-full py-4 rounded-2xl text-slate-300 font-bold text-xs uppercase active:scale-95 transition"
          >
            {t.login}
          </button>

          <button
            onClick={() => navigate("/register")}
            className="w-full py-2 text-xs text-slate-500 active:scale-95 transition"
          >
            {t.register}
          </button>
        </div>

        {/* FEATURES */}
        <div className="grid grid-cols-4 gap-2 mt-8 border-t border-slate-800/40 pt-6 opacity-40">
          {t.features.map((f) => (
            <div key={f.id} className="flex flex-col items-center text-center">
              <span className="text-[9px] font-bold uppercase text-slate-400">
                {f.title}
              </span>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}