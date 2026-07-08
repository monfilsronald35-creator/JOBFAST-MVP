import React, { memo, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";
import splashImg from "../assets/images/splash.png";

const LANGUAGES = [
  { code: "ht", name: "Kreyòl", flag: "🇭🇹" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
];

function SplashScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang =
    LANGUAGES.find((l) => l.code === i18n.language?.split("-")[0]) ||
    LANGUAGES[0];

  useEffect(() => {
    document.title = "JOBFAST";
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [dropdownOpen]);

  const handleLanguageSelect = async (langCode) => {
    await changeLanguage(langCode);
    setDropdownOpen(false);
  };

  return (
    <main className="relative min-h-screen w-full bg-[#050B18] text-white overflow-hidden flex flex-col justify-between items-center px-6 py-10 select-none">

      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#081225] via-[#050B18] to-[#02060F] z-0" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-[100px] z-0" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[100px] z-0" />

      {/* TOP BAR: Globe language picker top-right */}
      <div className="relative z-20 w-full flex justify-end" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all"
          aria-label={t("splash.chooseLanguage")}
        >
          🌐 <span>{currentLang.flag}</span>
          <span className="ml-1 uppercase text-xs tracking-wider">{currentLang.code}</span>
          <svg
            className={`ml-1 w-3 h-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute top-12 right-0 bg-[#0d1b35] border border-white/10 rounded-2xl shadow-2xl overflow-hidden min-w-[160px]">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors
                  ${lang.code === currentLang.code
                    ? "bg-yellow-400/20 text-yellow-300"
                    : "text-white hover:bg-white/10"
                  }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
                {lang.code === currentLang.code && (
                  <svg className="ml-auto w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CENTER CONTENT */}
      <section className="relative z-10 flex flex-col items-center text-center max-w-md w-full my-auto">
        <div className="mb-6 flex items-center justify-center">
          <img
            src={splashImg}
            alt="JOBFAST"
            className="w-56 h-56 md:w-64 md:h-64 object-contain drop-shadow-[0_15px_35px_rgba(234,179,8,0.40)]"
          />
        </div>

        <h1 className="text-6xl md:text-7xl font-black tracking-tight">
          <span className="text-yellow-400">JOB</span>
          <span className="text-white">FAST</span>
        </h1>

        <p className="mt-5 max-w-[280px] text-lg md:text-xl font-medium leading-relaxed text-slate-300 whitespace-pre-line">
          {t("splash.slogan")}
        </p>
      </section>

      {/* BOTTOM ACTIONS */}
      <section className="relative z-10 w-full max-w-sm flex flex-col gap-4 mt-auto">
        <button
          onClick={() => navigate("/onboarding")}
          className="w-full py-4 rounded-2xl bg-yellow-400 text-[#041126] text-lg font-extrabold shadow-xl hover:bg-yellow-500 active:scale-98 transition"
        >
          {t("splash.start")}
        </button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full py-2 text-lg font-semibold text-white transition duration-150 hover:text-yellow-400"
        >
          {t("splash.login")}
        </button>

        <button
          type="button"
          onClick={() => navigate("/register")}
          className="w-full py-1 text-base font-medium text-slate-400 transition duration-150 hover:text-white"
        >
          {t("splash.register")}
        </button>
      </section>
    </main>
  );
}

export default memo(SplashScreen);
