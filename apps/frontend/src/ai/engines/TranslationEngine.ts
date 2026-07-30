import type { TranslationRequest, TranslationResult } from '../types';
import { AIGateway } from '../gateway/AIGateway';
import { SYSTEM_PROMPTS, detectLanguage } from '../prompt/AIPromptEngine';

// Supported languages with display names
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  ht: 'Kreyòl Ayisyen',
  fr: 'Français',
  en: 'English',
  es: 'Español',
  pt: 'Português',
  ar: 'العربية',
  zh: '中文',
  hi: 'हिन्दी',
  sw: 'Kiswahili',
  yo: 'Yorùbá',
};

// In-memory cache for repeated translations
const _cache = new Map<string, TranslationResult>();

function cacheKey(req: TranslationRequest): string {
  return `${req.sourceLang ?? 'auto'}:${req.targetLang}:${req.text.slice(0, 80)}`;
}

export const TranslationEngine = {
  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const key = cacheKey(request);
    const hit = _cache.get(key);
    if (hit) return hit;

    const sourceLang = request.sourceLang ?? detectLanguage(request.text);

    // Skip if same language
    if (sourceLang !== 'unknown' && sourceLang === request.targetLang) {
      return { original: request.text, translated: request.text, sourceLang, targetLang: request.targetLang, confidence: 100 };
    }

    // Backend specialized translation service (DeepL, Google Translate, etc.)
    try {
      const res = await fetch('/api/ai/translate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...request, sourceLang }),
      });
      if (res.ok) {
        const result = await res.json() as TranslationResult;
        _cache.set(key, result);
        return result;
      }
    } catch { /* AI fallback */ }

    // AI fallback
    const langNames: Record<string, string> = { ht: 'Haitian Creole', fr: 'French', en: 'English', es: 'Spanish' };
    const targetName = langNames[request.targetLang] ?? request.targetLang;
    const translated = await AIGateway.complete(
      request.text,
      {
        strategy:     'fastest',
        systemPrompt: SYSTEM_PROMPTS.translator(sourceLang, request.targetLang),
        messages:     [{ role: 'user', content: request.text }],
        maxTokens:    Math.ceil(request.text.length / 2),
        cacheKey:     key,
        context:      { language: request.targetLang },
      },
    ).catch(() => request.text);

    const result: TranslationResult = {
      original:   request.text,
      translated,
      sourceLang: sourceLang !== 'unknown' ? sourceLang : 'en',
      targetLang: request.targetLang,
      confidence: 85,
      provider:   'ai',
    };
    _cache.set(key, result);
    return result;
  },

  async translateBatch(texts: string[], targetLang: string, sourceLang?: string): Promise<TranslationResult[]> {
    return Promise.all(texts.map(text => this.translate({ text, targetLang, sourceLang })));
  },

  async autoTranslate(text: string, userLang: string): Promise<string> {
    const detected = detectLanguage(text);
    if (detected === userLang || detected === 'unknown') return text;
    const result = await this.translate({ text, targetLang: userLang, sourceLang: detected });
    return result.translated;
  },

  detectLanguage,
  supportedLanguages: SUPPORTED_LANGUAGES,
};