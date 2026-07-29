import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import es from '../locales/es.json';
import en from '../locales/en.json';
import ht from '../locales/ht.json';
import fr from '../locales/fr.json';

export const SUPPORTED_LANGUAGES = ['ht', 'fr', 'en', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'ht';
export const STORAGE_KEY = 'jobfast_language';

const LANG_SET = new Set<string>(SUPPORTED_LANGUAGES);

// ── State ─────────────────────────────────────────────────────

let cachedLang:        string | null  = null;
let initPromise:       Promise<typeof i18n> | null = null;
let switchLock:        boolean        = false;
let listenersAttached: boolean        = false;
let isInitialized:     boolean        = false;
let lockTimer:         ReturnType<typeof setTimeout> | null = null;
let changeQueue:       Promise<void>  = Promise.resolve();
let lastBroadcast:     string | null  = null;

// ── Env helpers ───────────────────────────────────────────────

const isBrowser    = () => typeof window    !== 'undefined';
const hasNavigator = () => typeof navigator !== 'undefined';

// ── Safe storage ──────────────────────────────────────────────

const safeGet = (key: string): string | null => {
  try {
    if (!isBrowser()) return null;
    const value = window.localStorage.getItem(key);
    return value && value !== 'undefined' && value !== 'null' ? value : null;
  } catch { return null; }
};

const safeSet = (key: string, value: string): void => {
  try {
    if (!isBrowser() || value == null) return;
    window.localStorage.setItem(key, value);
  } catch {}
};

// ── Resources ─────────────────────────────────────────────────

const resources = {
  es: { translation: es || {} },
  en: { translation: en || {} },
  ht: { translation: ht || {} },
  fr: { translation: fr || {} },
};

// ── Normalizer ────────────────────────────────────────────────

const normalizeLang = (lang: unknown): string | null => {
  if (typeof lang !== 'string') return null;
  const clean = lang.toLowerCase().split('-')[0];
  return LANG_SET.has(clean) ? clean : null;
};

// ── Detection ─────────────────────────────────────────────────

const detectLanguage = (): string => {
  if (cachedLang) return cachedLang;
  if (!isBrowser()) return (cachedLang = DEFAULT_LANGUAGE);

  const saved = normalizeLang(safeGet(STORAGE_KEY));
  if (saved) return (cachedLang = saved);

  const browserLang = hasNavigator() ? normalizeLang(navigator.language) : null;
  return (cachedLang = browserLang || DEFAULT_LANGUAGE);
};

// ── Init ──────────────────────────────────────────────────────

export const initI18n = async (retry = 0): Promise<typeof i18n> => {
  if (isInitialized && i18n.isInitialized) return i18n;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('i18n init timeout')), 5000)
      );

      const init = (async () => {
        if (!i18n.isInitialized) {
          await i18n.use(initReactI18next).init({
            resources,
            lng:          detectLanguage(),
            fallbackLng:  DEFAULT_LANGUAGE,
            interpolation: { escapeValue: false },
            react:        { useSuspense: false },
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
      console.error('[i18n] init failed:', err);
      if (retry < 2) {
        initPromise = null;
        return initI18n(retry + 1);
      }
      return i18n;
    }
  })();

  return initPromise;
};

// ── Navigator language change ─────────────────────────────────

const attachNavigatorListener = (): void => {
  if (!isBrowser()) return;
  window.addEventListener('languagechange', () => {
    const lang = normalizeLang(navigator.language);
    if (lang) changeLanguage(lang);
  });
};

// ── Listeners ─────────────────────────────────────────────────

const attachListeners = (): void => {
  if (!isBrowser() || listenersAttached) return;
  listenersAttached = true;
  i18n.on('languageChanged', handleLanguageChange);
  window.addEventListener('storage', handleStorageChange);
};

// ── Broadcast Channel ─────────────────────────────────────────

let channel: BroadcastChannel | null = null;

const attachBroadcast = (): void => {
  if (!isBrowser() || typeof BroadcastChannel === 'undefined') return;
  channel = new BroadcastChannel('jobfast_i18n');
  channel.onmessage = (event: MessageEvent<{ type: string; lang: string }>) => {
    const data = event?.data;
    if (!data || data.type !== 'LANG_CHANGE') return;
    if (data.lang === lastBroadcast) return;
    changeLanguage(data.lang);
  };
};

// ── Sync ──────────────────────────────────────────────────────

const handleLanguageChange = (lng: string): void => {
  const normalized = normalizeLang(lng);
  if (!normalized) return;
  cachedLang = normalized;
  safeSet(STORAGE_KEY, normalized);
};

const handleStorageChange = (event: StorageEvent): void => {
  if (!isBrowser() || switchLock) return;
  if (event.key !== STORAGE_KEY || !event.newValue) return;
  const targetLang = normalizeLang(event.newValue);
  const current    = i18n.resolvedLanguage || i18n.language;
  if (targetLang && targetLang !== current) changeLanguage(targetLang);
};

// ── Change language ───────────────────────────────────────────

export const changeLanguage = async (lang: string): Promise<void> => {
  const safeLang = normalizeLang(lang) || DEFAULT_LANGUAGE;
  const current  = i18n.resolvedLanguage || i18n.language;
  if (current === safeLang) return;

  changeQueue = changeQueue.then(async () => {
    if (switchLock) return;
    switchLock = true;
    clearTimeout(lockTimer ?? undefined);
    lockTimer = setTimeout(() => { switchLock = false; }, 2500);

    try {
      cachedLang    = safeLang;
      lastBroadcast = safeLang;
      safeSet(STORAGE_KEY, safeLang);
      await i18n.changeLanguage(safeLang);
      channel?.postMessage?.({ type: 'LANG_CHANGE', lang: safeLang });
    } catch (e) {
      console.error('[i18n] switch failed:', e);
    } finally {
      switchLock = false;
    }
  });

  return changeQueue;
};

export const getCurrentLanguage = (): string =>
  i18n.resolvedLanguage || i18n.language || cachedLang || DEFAULT_LANGUAGE;

export const resetI18nCache = (): void => {
  cachedLang        = null;
  switchLock        = false;
  isInitialized     = false;
  initPromise       = null;
  listenersAttached = false;
  changeQueue       = Promise.resolve();
  lastBroadcast     = null;
  clearTimeout(lockTimer ?? undefined);
};

export const cleanupI18nListeners = (): void => {
  if (!isBrowser()) return;
  i18n.off('languageChanged', handleLanguageChange);
  window.removeEventListener('storage', handleStorageChange);
  channel?.close?.();
  listenersAttached = false;
};

export default i18n;