import { MessageRepository } from '../repositories/MessageRepository.js';

// Supported languages
const SUPPORTED_LANGS = new Set(['ht', 'en', 'es', 'fr', 'pt', 'de', 'it', 'nl', 'zh', 'ja', 'ar', 'ru']);

// In production: use Google Translate / DeepL / Azure Translator API
// Stub: returns a tagged string indicating what would be translated
async function translateWithProvider(text: string, sourceLang: string, targetLang: string): Promise<string> {
  // TODO: integrate real translation API
  // Example: await fetch(`https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`, { method: 'POST', body: JSON.stringify({ q: text, source: sourceLang, target: targetLang }) })
  return `[${targetLang.toUpperCase()}] ${text}`;
}

export const TranslationService = {
  async translate(messageId: string, content: string, targetLang: string, sourceLang = 'ht'): Promise<string> {
    if (!SUPPORTED_LANGS.has(targetLang)) return content;
    if (sourceLang === targetLang) return content;

    // Check cache first
    const cached = await MessageRepository.getTranslation(messageId, targetLang);
    if (cached) return cached.translatedText;

    const translated = await translateWithProvider(content, sourceLang, targetLang);
    await MessageRepository.saveTranslation(messageId, targetLang, translated);
    return translated;
  },

  isSupported(lang: string): boolean {
    return SUPPORTED_LANGS.has(lang.toLowerCase());
  },

  getSupportedLanguages(): string[] {
    return Array.from(SUPPORTED_LANGS);
  },
};
