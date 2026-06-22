// src/pages/SplashScreen.jsx
import React, { memo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changeLanguage } from "../i18n";

// Placeholder SVG logo instead of missing image
const SplashLogo = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <circle cx="100" cy="100" r="90" fill="#EAB308" fillOpacity="0.1" />
    <circle cx="100" cy="100" r="70" fill="#EAB308" fillOpacity="0.2" />
    <circle cx="100" cy="100" r="50" fill="#EAB308" fillOpacity="0.3" />
    <text x="100" y="90" textAnchor="middle" fontSize="40" fontWeight="bold" fill="#EAB308">JOB</text>
    <text x="100" y="130" textAnchor="middle" fontSize="40" fontWeight="bold" fill="white">FAST</text>
  </svg>
); 

function SplashScreen() {
  const navigate = useNavigate();
  const [selectedLang, setSelectedLang] = useState("ht");

  const languages = [
    { code: "ht", name: "Kreyòl", flag: "🇭🇹" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "es", name: "Español", flag: "🇪🇸" }
  ];

  const handleLanguageChange = async (langCode) => {
    setSelectedLang(langCode);
    await changeLanguage(langCode);
  };

  useEffect(() => {
    document.title = "JOBFAST";
  }, []);

  return (
    <main className="relative min-h-screen w-full bg-[#050B18] text-white overflow-hidden flex flex-col justify-between items-center px-6 py-10 select-none">
      
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#081225] via-[#050B18] to-[#02060F] z-0" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-[100px] z-0" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[100px] z-0" />

      {/* TOP SPACER */}
      <div className="h-4 z-10" />

      {/* LANGUAGE SELECTOR */}
      <div className="relative z-10 w-full max-w-sm mx-auto mb-4">
        <div className="flex justify-center gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedLang === lang.code
                  ? "bg-yellow-400 text-black scale-105"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {lang.flag} {lang.name}
            </button>
          ))}
        </div>
      </div>

      {/* CENTER CONTENT: LOGO + TIT + SLOGAN */}
      <section className="relative z-10 flex flex-col items-center text-center max-w-md w-full my-auto">
        
        {/* LOGO - Gwosè MVP domine ekran an (w-56 / w-64) ak bèl lonbraj */}
        <div className="mb-6 flex items-center justify-center">
          <div className="w-56 h-56 md:w-64 md:h-64 object-contain filter drop-shadow-[0_15px_35px_rgba(234,179,8,0.35)]">
            <SplashLogo />
          </div>
        </div>

        {/* TITLE - Tèks jeyan ak bèl enpak */}
        <h1 className="text-6xl md:text-7xl font-black tracking-tight">
          <span className="text-yellow-400">JOB</span>
          <span className="text-white">FAST</span>
        </h1>

        {/* SLOGAN - Espasmt-5 ki pi aere jan w mande l la */}
        <p className="mt-5 max-w-[280px] text-lg md:text-xl font-medium leading-relaxed text-slate-300">
          Travay. Sèvis. Biznis. Kote w ye.
          <br />
          Tout nan yon sèl app.
        </p>
      </section>

      {/* BOTTOM ACTIONS */}
      <section className="relative z-10 w-full max-w-sm flex flex-col gap-4 mt-auto">
        
        {/* BOUTON NATIF HTML - Ranplase Button.jsx pou evite chanjman stil */}
        <button
          onClick={() => navigate("/onboarding")}
          className="w-full py-4 rounded-2xl bg-yellow-400 text-[#041126] text-lg font-extrabold shadow-xl hover:bg-yellow-500 active:scale-98 transition"
        >
          KÒMANSE
        </button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full py-2 text-lg font-semibold text-white transition duration-150 hover:text-yellow-400"
        >
          Login
        </button>

        <button
          type="button"
          onClick={() => navigate("/register")}
          className="w-full py-1 text-base font-medium text-slate-400 transition duration-150 hover:text-white"
        >
          Kreye Kont
        </button>
      </section>
    </main>
  );
}

export default memo(SplashScreen);
