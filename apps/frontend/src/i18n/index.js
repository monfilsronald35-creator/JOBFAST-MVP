/* ==================================================
   🌍 JOBFAST i18n SYSTEM (MVP STABLE)
   FILE: apps/frontend/src/i18n/index.js
   ================================================== */

import i18n from "i18next";

import { initReactI18next } from "react-i18next";

/* ==================================================
   📍 LOCALES
   ================================================== */

import en from "../locales/en.json";
import fr from "../locales/fr.json";
import ht from "../locales/ht.json";

/* ==================================================
   📍 AVAILABLE LANGUAGES
   ================================================== */

const resources = {
  en: {
    translation: en
  },

  fr: {
    translation: fr
  },

  ht: {
    translation: ht
  }
};

/* ==================================================
   📍 SAFE LANGUAGE DETECTION
   ================================================== */

const getSavedLanguage = () => {
  try {
    const savedLanguage =
      localStorage.getItem(
        "jobfast_language"
      );

    if (
      savedLanguage === "en" ||
      savedLanguage === "fr" ||
      savedLanguage === "ht"
    ) {
      return savedLanguage;
    }

    const browserLanguage =
      navigator.language
        ?.toLowerCase()
        ?.split("-")[0];

    if (
      browserLanguage === "fr"
    ) {
      return "fr";
    }

    if (
      browserLanguage === "ht"
    ) {
      return "ht";
    }

    return "en";
  } catch (error) {
    return "en";
  }
};

/* ==================================================
   📍 INIT i18n
   ================================================== */

i18n.use(initReactI18next).init({
  resources,

  lng: getSavedLanguage(),

  fallbackLng: "en",

  interpolation: {
    escapeValue: false
  },

  react: {
    useSuspense: false
  }
});

/* ==================================================
   📍 CHANGE LANGUAGE
   ================================================== */

export const changeLanguage = (
  language = "en"
) => {
  const safeLanguage =
    ["en", "fr", "ht"].includes(
      language
    )
      ? language
      : "en";

  localStorage.setItem(
    "jobfast_language",
    safeLanguage
  );

  i18n.changeLanguage(
    safeLanguage
  );
};

/* ==================================================
   📍 GET CURRENT LANGUAGE
   ================================================== */

export const getCurrentLanguage =
  () => {
    return i18n.language || "en";
  };

/* ==================================================
   📍 EXPORT
   ================================================== */

export default i18n;