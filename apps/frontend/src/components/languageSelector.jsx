import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";

// ==================================================
// 🌍 AVAILABLE LANGUAGES (IMMUTABLE)
// ==================================================
const LANGUAGES = Object.freeze([
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "ht", label: "Kreyòl" },
  { code: "fr", label: "Français" }
]);

// ==================================================
// 📍 COMPONENT
// ==================================================
export default function LanguageSelector({ compact = false }) {
  const { i18n } = useTranslation();

  // ⚡ CURRENT LANGUAGE (SOURCE OF TRUTH = i18n)
  const currentLanguage = i18n?.language ?? "es";

  // ==================================================
  // ⚡ HANDLE CHANGE (SAFE + NO STALE BUGS)
  // ==================================================
  const handleChange = useCallback(
    (event) => {
      const newLanguage = event.target.value;

      // re-check live state to avoid stale issues
      const activeLanguage = i18n?.language ?? "es";

      if (!newLanguage || newLanguage === activeLanguage) return;

      i18n?.changeLanguage?.(newLanguage);
      changeLanguage?.(newLanguage);
    },
    [i18n]
  );

  // ==================================================
  // 🎨 STYLES
  // ==================================================
  const containerStyle = useMemo(
    () => ({
      display: "flex",
      alignItems: "center",
      width: compact ? "fit-content" : "100%"
    }),
    [compact]
  );

  const selectStyle = useMemo(
    () => ({
      width: compact ? "140px" : "100%",
      padding: compact ? "8px" : "10px 12px",
      border: "1px solid #334155",
      borderRadius: "8px",
      background: "#1e293b",
      color: "#ffffff",
      fontSize: "14px",
      cursor: "pointer",
      outline: "none",
      fontFamily: "Inter, Arial, sans-serif",
      transition: "all 0.2s ease"
    }),
    [compact]
  );

  // ==================================================
  // 📍 UI
  // ==================================================
  return (
    <div style={containerStyle}>
      <select
        value={currentLanguage}
        onChange={handleChange}
        style={selectStyle}
        aria-label="Select application language"
      >
        {LANGUAGES.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}