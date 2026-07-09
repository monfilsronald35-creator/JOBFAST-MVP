import React, { memo, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { changeLanguage, STORAGE_KEY } from "../i18n";
import splashImg from "../assets/images/splash.png";

const LANGUAGES = [
  { code: "ht", name: "Kreyòl Ayisyen", flag: "🇭🇹", native: "Kreyòl" },
  { code: "fr", name: "Français",        flag: "🇫🇷", native: "Français" },
  { code: "en", name: "English",         flag: "🇬🇧", native: "English" },
  { code: "es", name: "Español",         flag: "🇩🇴", native: "Español" },
];

// Language has been explicitly chosen in this session if stored
const hasChosenLanguage = () => {
  try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
};

function SplashScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Show the language picker first if no language is saved yet
  const [langPicked, setLangPicked] = useState(hasChosenLanguage);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    document.title = "JOBFAST";
  }, []);

  const currentLang =
    LANGUAGES.find((l) => l.code === i18n.language?.split("-")[0]) || LANGUAGES[0];

  const handlePick = async (code) => {
    setSelecting(true);
    await changeLanguage(code);
    setLangPicked(true);
    setSelecting(false);
  };

  // ── LANGUAGE PICKER SCREEN ──────────────────────────────────────
  if (!langPicked) {
    return (
      <main className="relative min-h-screen w-full bg-[#050B18] text-white overflow-hidden flex flex-col items-center justify-center px-6 py-10 select-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#081225] via-[#050B18] to-[#02060F] z-0" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-[120px] z-0" />

        <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6">
          {/* Logo mark */}
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight mb-1">
              <span className="text-yellow-400">JOB</span>
              <span className="text-white">FAST</span>
            </h1>
            <p className="text-2xl font-bold text-white mt-3">🌐</p>
          </div>

          {/* Picker card */}
          <div className="w-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            {/* Header — shown in all 4 languages since user hasn't picked yet */}
            <div className="px-5 pt-5 pb-3 text-center border-b border-white/10">
              <p className="text-white font-bold text-base">Choose / Chwazi / Choisir / Elegir</p>
              <p className="text-slate-400 text-xs mt-0.5">your language / lang ou / votre langue / tu idioma</p>
            </div>

            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handlePick(lang.code)}
                disabled={selecting}
                className={`w-full flex items-center gap-4 px-5 py-4 transition-all border-b border-white/5 last:border-0
                  ${lang.code === currentLang.code
                    ? "bg-yellow-400/15 text-yellow-300"
                    : "text-white hover:bg-white/8 active:bg-white/15"
                  }
                  disabled:opacity-60`}
              >
                <span className="text-3xl">{lang.flag}</span>
                <div className="text-left">
                  <p className="font-bold text-sm">{lang.native}</p>
                  <p className="text-xs text-slate-400">{lang.name}</p>
                </div>
                {lang.code === currentLang.code && (
                  <span className="ml-auto text-yellow-400 text-lg">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* If already has language stored, allow skip */}
          <button
            type="button"
            onClick={() => setLangPicked(true)}
            className="text-slate-500 text-sm hover:text-slate-300 transition"
          >
            {selecting ? "..." : "↓ " + (currentLang.native === "Kreyòl" ? "Sote" : currentLang.native === "Français" ? "Passer" : currentLang.native === "English" ? "Skip" : "Omitir")}
          </button>
        </div>
      </main>
    );
  }

  // ── MAIN SPLASH ─────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen w-full bg-[#050B18] text-white overflow-hidden flex flex-col justify-between items-center px-6 py-10 select-none">

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#081225] via-[#050B18] to-[#02060F] z-0" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-[100px] z-0" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[100px] z-0" />

      {/* TOP BAR — inline language switcher */}
      <div className="relative z-20 w-full flex justify-end">
        <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handlePick(lang.code)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                lang.code === currentLang.code
                  ? "bg-yellow-400 text-[#041126]"
                  : "text-white/60 hover:text-white"
              }`}
              aria-label={lang.name}
            >
              {lang.flag}
            </button>
          ))}
        </div>
      </div>

      {/* CENTER */}
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
