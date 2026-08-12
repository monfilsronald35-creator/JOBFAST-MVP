import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown } from "lucide-react";
import {
  changeLanguage,
  normalizeLanguage,
  getLanguageLabel,
  SUPPORTED_LANGUAGES,
} from "../i18n";

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

function LanguageSelector({
  compact = false,
  className = "",
}: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();

  const currentLanguage = useMemo(
    () => normalizeLanguage(i18n.language),
    [i18n.language],
  );

  const handleChange = useCallback(
    async (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newLang = event.target.value;
      if (!newLang || newLang === currentLanguage) return;
      try {
        await changeLanguage(newLang);
      } catch (error) {
        console.error("JOBFAST language change failed:", error);
      }
    },
    [currentLanguage],
  );

  return (
    <div
      className={[
        "relative flex items-center select-none",
        compact ? "w-fit" : "w-full",
        className,
      ].join(" ")}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 z-10 flex items-center justify-center text-slate-500"
      >
        <Globe className="h-4 w-4" strokeWidth={2} />
      </div>

      <select
        value={currentLanguage}
        onChange={handleChange}
        aria-label={t("common.select_language", "Chwazi lang aplikasyon an")}
        className={[
          "w-full appearance-none rounded-xl",
          "border border-slate-800/60 bg-[#0B1528]",
          "pl-10 pr-8",
          "text-xs font-black uppercase tracking-wider text-slate-300",
          "outline-none transition-all duration-200 cursor-pointer",
          "hover:border-slate-700",
          "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20",
          compact ? "max-w-[140px] py-2.5 text-[10px] tracking-widest" : "py-3.5",
        ].join(" ")}
      >
        {SUPPORTED_LANGUAGES.map((code) => (
          <option
            key={code}
            value={code}
            className="bg-[#0B1528] text-white font-sans normal-case tracking-normal text-sm"
          >
            {getLanguageLabel(code)}
          </option>
        ))}
      </select>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 flex items-center text-slate-500"
      >
        <ChevronDown className="h-3.5 w-3.5" strokeWidth={3} />
      </div>
    </div>
  );
}

export default React.memo(LanguageSelector);
