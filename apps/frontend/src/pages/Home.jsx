import React, { memo, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ... [Kenbe menm objè "translations" ak fonksyon "getDefaultLanguage" ak "getSavedLanguage" yo] ...

function Home() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(() => getSavedLanguage() || getDefaultLanguage());
  const t = useMemo(() => translations[lang] || translations.ht, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const changeLanguage = (language) => {
    localStorage.setItem("jobfast-lang", language);
    setLang(language);
  };

  return (
    <main className="min-h-screen bg-[#0B1528] text-white flex flex-col items-center justify-center p-6 font-sans">
      <section className="w-full max-w-sm text-center">
        
        {/* LANGUAGE SWITCHER */}
        <div className="flex justify-center gap-3 mb-8">
          {['ht', 'en', 'es', 'fr'].map((l) => (
            <button
              key={l}
              onClick={() => changeLanguage(l)}
              className={`p-2 rounded-xl transition-all ${lang === l ? 'bg-blue-600' : 'bg-[#1e293b] hover:bg-[#2d3a4f]'}`}
            >
              {l === 'ht' ? '🇭🇹' : l === 'en' ? '🇺🇸' : l === 'es' ? '🇪🇸' : '🇫🇷'}
            </button>
          ))}
        </div>

        {/* HERO */}
        <h1 className="text-3xl font-bold mb-2 tracking-tight">{t.title}</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">{t.description}</p>

        {/* ACTIONS (Bouton estratejik MVP) */}
        <div className="flex flex-col gap-4 mb-10">
          <button 
            onClick={() => navigate("/register")}
            className="w-full py-4 bg-[#F59E0B] hover:bg-[#d97706] text-[#0B1528] font-bold rounded-xl transition-all active:scale-95 shadow-lg"
          >
            {t.register}
          </button>

          <button 
            onClick={() => navigate("/login")}
            className="w-full py-4 bg-transparent border-2 border-[#1e293b] hover:border-gray-600 font-bold rounded-xl transition-all active:scale-95"
          >
            {t.login}
          </button>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-2 gap-4">
          {t.features.map((feature) => (
            <div key={feature.title} className="bg-[#0F1E36] p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all text-left">
              <span className="text-2xl mb-2 block">{feature.icon}</span>
              <h3 className="font-bold text-sm mb-1">{feature.title}</h3>
              <p className="text-[10px] text-gray-500 leading-tight">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default memo(Home);
