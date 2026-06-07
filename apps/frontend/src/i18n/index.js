/* ==================================================
   🌍 JOBFAST i18n SYSTEM (PRODUCTION v3.6 - PREMIUM OPTIMIZED)
   ================================================== */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import es from "../locales/es.json";
import en from "../locales/en.json";
import ht from "../locales/ht.json";
import fr from "../locales/fr.json";

/* ==================================================
   📍 CONSTANTS
   ================================================== */

export const SUPPORTED_LANGUAGES = ["es", "en", "ht", "fr"];
const DEFAULT_LANGUAGE = "es";
const STORAGE_KEY = "jobfast_language";

const LANG_SET = new Set(SUPPORTED_LANGUAGES);

/* ==================================================
   📍 CACHE (safe for SSR + runtime reset)
   ================================================== */

let cachedLang = null;

/* ==================================================
   📍 SAFE STORAGE
   ================================================== */

const safeGet = (key) => {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key, value) => {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
    }
  } catch {}
};

/* ==================================================
   📍 TRANSLATIONS
   ================================================== */

const resources = Object.freeze({
  es: { translation: es },
  en: { translation: en },
  ht: { translation: ht },
  fr: { translation: fr }
});

/* ==================================================
   📍 NORMALIZER
   ================================================== */

const normalizeLang = (lang) => {
  if (typeof lang !== "string") return null;

  const clean = lang.toLowerCase().split("-")[0];
  return LANG_SET.has(clean) ? clean : null;
};

/* ==================================================
   📍 DETECTION (SSR SAFE + STABLE)
   ================================================== */

const detectLanguage = () => {
  if (cachedLang) return cachedLang;

  if (typeof window === "undefined") {
    return (cachedLang = DEFAULT_LANGUAGE);
  }

  const saved = normalizeLang(safeGet(STORAGE_KEY));
  if (saved) return (cachedLang = saved);

  const browser =
    typeof navigator !== "undefined"
      ? normalizeLang(navigator.language)
      : null;

  return (cachedLang = browser || DEFAULT_LANGUAGE);
};

/* ==================================================
   📍 INIT (SINGLETON SAFE)
   ================================================== */

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: detectLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  });
}

/* ==================================================
   📍 SYNC CACHE WITH i18n
   ================================================== */

const handleLanguageChange = (lng) => {
  const normalized = normalizeLang(lng);
  if (normalized) cachedLang = normalized;
};

i18n.on("languageChanged", handleLanguageChange);

/* ==================================================
   📍 CROSS-TAB SYNCHRONIZATION
   ================================================== */

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      const targetLang = normalizeLang(event.newValue);
      const current = i18n.resolvedLanguage || i18n.language;
      
      if (targetLang && targetLang !== current) {
        cachedLang = targetLang;
        i18n.changeLanguage(targetLang);
      }
    }
  });
}

/* ==================================================
   📍 SWITCH LANGUAGE
   ================================================== */

export const changeLanguage = (lang) => {
  const safeLang = normalizeLang(lang) || DEFAULT_LANGUAGE;
  const current = i18n.resolvedLanguage || i18n.language;

  if (current === safeLang) return;

  cachedLang = safeLang;
  safeSet(STORAGE_KEY, safeLang);

  i18n.changeLanguage(safeLang);
};

/* ==================================================
   📍 GET CURRENT LANGUAGE
   ================================================== */

export const getCurrentLanguage = () =>
  i18n.resolvedLanguage ||
  i18n.language ||
  cachedLang ||
  DEFAULT_LANGUAGE;

/* ==================================================
   📍 OPTIONAL CLEANUP
   ================================================== */

export const cleanupI18nListener = () => {
  i18n.off("languageChanged", handleLanguageChange);
};

export default i18n;
