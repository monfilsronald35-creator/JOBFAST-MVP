import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ht from '../locales/ht.json';
import fr from '../locales/fr.json';
import en from '../locales/en.json';
import es from '../locales/es.json';

export const SUPPORTED_LANGUAGES = ['ht', 'fr', 'en', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'ht';
export const STORAGE_KEY = 'jobfast_language';

const LANG_SET = new Set<string>(SUPPORTED_LANGUAGES);

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  ht: 'Kreyòl',
  fr: 'Français',
  en: 'English',
  es: 'Español',
};

// ── SSR guards ─────────────────────────────────────────────────
const isBrowser = () => typeof window !== 'undefined';

// ── Safe localStorage ─────────────────────────────────────────
const safeGet = (key: string): string | null => {
  try {
    if (!isBrowser()) return null;
    const v = localStorage.getItem(key);
    return v && v !== 'undefined' && v !== 'null' ? v : null;
  } catch { return null; }
};

const safeSet = (key: string, value: string): void => {
  try { if (isBrowser()) localStorage.setItem(key, value); } catch {}
};

// ── Resources ─────────────────────────────────────────────────
const resources = {
  ht: { translation: ht },
  fr: { translation: fr },
  en: { translation: en },
  es: { translation: es },
};

// ── Exported utilities ────────────────────────────────────────

export const normalizeLanguage = (lang: unknown): SupportedLanguage => {
  if (typeof lang !== 'string') return DEFAULT_LANGUAGE;
  const normalized = lang.toLowerCase().replace(/-.*$/, '');
  return LANG_SET.has(normalized) ? (normalized as SupportedLanguage) : DEFAULT_LANGUAGE;
};

export const getLanguageLabel = (code: string): string =>
  LANGUAGE_LABELS[normalizeLanguage(code)];

// ── Detection (stored → browser → default) ───────────────────
const detectLanguage = (): SupportedLanguage => {
  if (!isBrowser()) return DEFAULT_LANGUAGE;
  const saved = safeGet(STORAGE_KEY);
  if (saved) return normalizeLanguage(saved);

  // Prefer the browser's preferred languages list if available
  try {
    const langs = (navigator && (navigator as any).languages) || [];
    for (const l of langs) {
      const norm = normalizeLanguage(l);
      if (norm) return norm;
    }
  } catch {
    // fall through
  }

  const browser = typeof navigator !== 'undefined' ? navigator.language : null;
  return normalizeLanguage(browser);
};

// ── Init ──────────────────────────────────────────────────────
let initPromise: Promise<typeof i18n> | null = null;

export const initI18n = async (): Promise<typeof i18n> => {
  if (i18n.isInitialized) return i18n;
  if (initPromise) return initPromise;

  initPromise = i18n
    .use(initReactI18next)
    .init({
      resources,
      lng:         detectLanguage(),
      // Keep Kreyòl as the primary default language, but prefer Spanish then English
      // when a key is missing. This makes fallbacks friendlier for Spanish-speaking users.
      fallbackLng: ['es', 'en'],
      interpolation: { escapeValue: false },
      react:       { useSuspense: false },
    })
    .then(() => {
      i18n.on('languageChanged', (lng: string) => {
        safeSet(STORAGE_KEY, normalizeLanguage(lng));
      });
      return i18n;
    })
    .catch((err) => {
      console.error('[i18n] init failed:', err);
      initPromise = null;
      return i18n;
    });

  return initPromise;
};

// ── Language control ──────────────────────────────────────────
export const changeLanguage = async (lang: string): Promise<void> => {
  const target  = normalizeLanguage(lang);
  const current = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
  if (target === current) return;
  safeSet(STORAGE_KEY, target);
  await i18n.changeLanguage(target);
};

export const getCurrentLanguage = (): SupportedLanguage =>
  normalizeLanguage(i18n.resolvedLanguage || i18n.language);

export default i18n;
