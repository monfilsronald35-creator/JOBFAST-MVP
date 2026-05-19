/* ==================================================
   🌍 JOBFAST LANGUAGE SELECTOR (MVP STABLE)
   FILE: apps/frontend/src/components/LanguageSelector.jsx
   ================================================== */

import React from "react";

import { useTranslation } from "react-i18next";

import {
  changeLanguage,
  getCurrentLanguage
} from "../i18n";

/* ==================================================
   📍 AVAILABLE LANGUAGES
   ================================================== */

const LANGUAGES = [
  {
    code: "en",
    label: "English"
  },

  {
    code: "fr",
    label: "Français"
  },

  {
    code: "ht",
    label: "Kreyòl"
  }
];

/* ==================================================
   📍 COMPONENT
   ================================================== */

export default function LanguageSelector({
  compact = false
}) {
  const { i18n } =
    useTranslation();

  /* ==================================================
     📍 CURRENT LANGUAGE
     ================================================== */

  const currentLanguage =
    getCurrentLanguage();

  /* ==================================================
     📍 HANDLE CHANGE
     ================================================== */

  const handleChange = (event) => {
    const language =
      event.target.value;

    changeLanguage(language);

    i18n.changeLanguage(language);
  };

  /* ==================================================
     📍 UI
     ================================================== */

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",

        width: compact
          ? "fit-content"
          : "100%"
      }}
    >
      <select
        value={currentLanguage}
        onChange={handleChange}

        style={{
          width: compact
            ? "140px"
            : "100%",

          padding: compact
            ? "8px"
            : "10px 12px",

          border:
            "1px solid #334155",

          borderRadius: "8px",

          background: "#1e293b",

          color: "#ffffff",

          fontSize: "14px",

          cursor: "pointer",

          outline: "none"
        }}
      >
        {LANGUAGES.map(
          (language) => (
            <option
              key={language.code}
              value={language.code}
            >
              {language.label}
            </option>
          )
        )}
      </select>
    </div>
  );
}