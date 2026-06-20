/* ==================================================
   🌍 JOBFAST i18n SYSTEM (v4.9 - ENTERPRISE FINAL PATCH)
   ================================================== */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import es from "../locales/es.json";
import en from "../locales/en.json";
import ht from "../locales/ht.json";
import fr from "../locales/fr.json";

/* ==================================================
   📍 CONFIG
   ================================================== */

export const SUPPORTED_LANGUAGES = ["es", "en", "ht", "fr"];
export const DEFAULT_LANGUAGE = "es";
export const STORAGE_KEY = "jobfast_language";

const LANG_SET = new Set(SUPPORTED_LANGUAGES);

/* ==================================================
   📍 STATE
   ================================================== */

let cachedLang = null;
let initPromise = null;
let switchLock = false;
let listenersAttached = false;
let isInitialized = false;
let lockTimer = null;
let changeQueue = Promise.resolve();
let lastBroadcast = null;

/* ==================================================
   📍 ENV
   ================================================== */

const isBrowser = () => typeof window !== "undefined";
const hasNavigator = () => typeof navigator !== "undefined";

/* ==================================================
   📍 SAFE STORAGE
   ================================================== */

const safeGet = (key) => {
  try {
    if (!isBrowser()) return null;
    const value = window.localStorage.getItem(key);
    return value && value !== "undefined" && value !== "null" ? value : null;
  } catch {
    return null;
  }
};

const safeSet = (key, value) => {
  try {
    if (!isBrowser() || value == null) return;
    window.localStorage.setItem(key, value);
  } catch {}
};

/* ==================================================
   📍 TRANSLATIONS
   ================================================== */

const resources = {
  es: { translation: es || {} },
  en: { translation: en || {} },
  ht: { translation: ht || {} },
  fr: { translation: fr || {} },
};

/* ==================================================
   📍 NORMALIZER
   ================================================== */

const normalizeLang = (lang) => {
  if (typeof lang !== "string") return null;
  const clean = lang.toLowerCase().split("-")[0];
  return LANG_SET.has(clean) ? clean : null;
};

/* ==================================================
   📍 DETECTION
   ================================================== */

const detectLanguage = () => {
  if (cachedLang) return cachedLang;

  if (!isBrowser()) return (cachedLang = DEFAULT_LANGUAGE);

  const saved = normalizeLang(safeGet(STORAGE_KEY));
  if (saved) return (cachedLang = saved);

  const browserLang = hasNavigator()
    ? normalizeLang(navigator.language)
    : null;

  return (cachedLang = browserLang || DEFAULT_LANGUAGE);
};

/* ==================================================
   📍 INIT (FIXED: NO RECURSION BUG + TIMEOUT GUARD)
   ================================================== */

export const initI18n = async (retry = 0) => {
  if (isInitialized && i18n.isInitialized) return i18n;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // 🧯 timeout guard (anti freeze)
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("i18n init timeout")), 5000)
      );

      const init = (async () => {
        if (!i18n.isInitialized) {
          await i18n.use(initReactI18next).init({
            resources,
            lng: detectLanguage(),
            fallbackLng: DEFAULT_LANGUAGE,
            interpolation: { escapeValue: false },
            react: { useSuspense: false },
          });
        }
      })();

      await Promise.race([init, timeout]);

      isInitialized = true;
      attachListeners();
      attachBroadcast();
      attachNavigatorListener();

      return i18n;
    } catch (err) {
      console.error("[i18n] init failed:", err);

      if (retry < 2) {
        initPromise = null;
        return initI18n(retry + 1); // ✔ FIXED BUG (was initI18n typo risk)
      }

      return i18n;
    }
  })();

  return initPromise;
};

/* ==================================================
   📍 NAVIGATOR LANGUAGE CHANGE SUPPORT
   ================================================== */

const attachNavigatorListener = () => {
  if (!isBrowser()) return;

  window.addEventListener("languagechange", () => {
    const lang = normalizeLang(navigator.language);
    if (lang) changeLanguage(lang);
  });
};

/* ==================================================
   📍 LISTENERS
   ================================================== */

const attachListeners = () => {
  if (!isBrowser() || listenersAttached) return;

  listenersAttached = true;

  i18n.on("languageChanged", handleLanguageChange);
  window.addEventListener("storage", handleStorageChange);
};

/* ==================================================
   📍 BROADCAST CHANNEL (SAFE + LOOP PREVENTION)
   ================================================== */

let channel = null;

const attachBroadcast = () => {
  if (!isBrowser() || typeof BroadcastChannel === "undefined") return;

  channel = new BroadcastChannel("jobfast_i18n");

  channel.onmessage = (event) => {
    const data = event?.data;
    if (!data || data.type !== "LANG_CHANGE") return;

    if (data.lang === lastBroadcast) return; // 🛑 anti loop

    changeLanguage(data.lang);
  };
};

/* ==================================================
   📍 SYNC
   ================================================== */

const handleLanguageChange = (lng) => {
  const normalized = normalizeLang(lng);
  if (!normalized) return;

  cachedLang = normalized;
  safeSet(STORAGE_KEY, normalized);
};

/* ==================================================
   📍 STORAGE SYNC
   ================================================== */

const handleStorageChange = (event) => {
  if (!isBrowser() || switchLock) return;
  if (event.key !== STORAGE_KEY || !event.newValue) return;

  const targetLang = normalizeLang(event.newValue);
  const current = i18n.resolvedLanguage || i18n.language;

  if (targetLang && targetLang !== current) {
    changeLanguage(targetLang);
  }
};

/* ==================================================
   📍 SWITCH LANGUAGE (QUEUE + DEBOUNCE HARDENED)
   ================================================== */

export const changeLanguage = async (lang) => {
  const safeLang = normalizeLang(lang) || DEFAULT_LANGUAGE;

  const current = i18n.resolvedLanguage || i18n.language;
  if (current === safeLang) return;

  changeQueue = changeQueue.then(async () => {
    if (switchLock) return;

    switchLock = true;
    clearTimeout(lockTimer);

    lockTimer = setTimeout(() => (switchLock = false), 2500);

    try {
      cachedLang = safeLang;
      safeSet(STORAGE_KEY, safeLang);

      lastBroadcast = safeLang; // 🛑 prevent loop
      await i18n.changeLanguage(safeLang);

      channel?.postMessage?.({ type: "LANG_CHANGE", lang: safeLang });
    } catch (e) {
      console.error("[i18n] switch failed:", e);
    } finally {
      switchLock = false;
    }
  });

  return changeQueue;
};

/* ==================================================
   📍 GET LANGUAGE
   ================================================== */

export const getCurrentLanguage = () =>
  i18n.resolvedLanguage ||
  i18n.language ||
  cachedLang ||
  DEFAULT_LANGUAGE;

/* ==================================================
   📍 RESET
   ================================================== */

export const resetI18nCache = () => {
  cachedLang = null;
  switchLock = false;
  isInitialized = false;
  initPromise = null;
  listenersAttached = false;
  changeQueue = Promise.resolve();
  lastBroadcast = null;

  clearTimeout(lockTimer);
};

/* ==================================================
   📍 CLEANUP
   ================================================== */

export const cleanupI18nListeners = () => {
  if (!isBrowser()) return;

  i18n.off("languageChanged", handleLanguageChange);
  window.removeEventListener("storage", handleStorageChange);

  channel?.close?.();

  listenersAttached = false;
};

export default i18n;