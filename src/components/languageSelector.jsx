import React from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown } from "lucide-react";

const LANGUAGES = Object.freeze([
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "ht", label: "Kreyòl" },
  { code: "fr", label: "Français" },
]);

function LanguageSelector({ compact = false }) {
  const { i18n } = useTranslation();
  const currentLanguage = (i18n?.language || "es").slice(0, 2);

  const handleChange = (event) => {
    const newLanguage = event.target.value;
    if (!newLanguage || newLanguage === currentLanguage) return;
    i18n?.changeLanguage?.(newLanguage);
  };

  return (
    <div className={`relative flex items-center select-none ${compact ? "w-fit" : "w-full"}`}>
      <div className="pointer-events-none absolute left-3.5 flex items-center justify-center text-slate-500">
        <Globe className="h-4 w-4" strokeWidth={2} />
      </div>

      <select
        value={currentLanguage}
        onChange={handleChange}
        aria-label="Chwazi lang aplikasyon an"
        className={`
          w-full appearance-none rounded-xl border border-slate-800/60 bg-navy-950
          pl-10 pr-8 text-xs font-black uppercase tracking-wider text-slate-300
          outline-none transition-all duration-200 cursor-pointer
          focus:border-gold-400 focus:ring-4 focus:ring-gold-400/10
          focus-visible:ring-4 focus-visible:ring-gold-400/20
          ${compact ? "max-w-[140px] py-2.5 text-[10px] tracking-widest" : "py-3.5"}
        `}
      >
        {LANGUAGES.map(({ code, label }) => (
          <option
            key={code}
            value={code}
            className="bg-navy-950 text-white font-sans normal-case tracking-normal text-sm"
          >
            {label}
          </option>
        ))}
      </select>

      <div className="pointer-events-none absolute right-3.5 flex items-center text-slate-500">
        <ChevronDown className="h-3.5 w-3.5" strokeWidth={3} />
      </div>
    </div>
  );
}

export default LanguageSelector;
