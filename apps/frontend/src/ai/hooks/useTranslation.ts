import { useState, useCallback, useEffect } from 'react';
import type { TranslationResult } from '../types';
import { TranslationEngine } from '../engines/TranslationEngine';
import { detectLanguage } from '../prompt/AIPromptEngine';

export function useTranslation(targetLang = 'ht') {
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<TranslationResult | null>(null);

  const translate = useCallback(async (text: string, sourceLang?: string): Promise<string> => {
    if (!text.trim()) return text;
    setLoading(true);
    setError(null);
    try {
      const result = await TranslationEngine.translate({ text, targetLang, sourceLang });
      setLastResult(result);
      return result.translated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
      return text;
    } finally {
      setLoading(false);
    }
  }, [targetLang]);

  const autoTranslate = useCallback(async (text: string): Promise<string> => {
    return TranslationEngine.autoTranslate(text, targetLang);
  }, [targetLang]);

  return { translate, autoTranslate, loading, error, lastResult, detectLanguage };
}

// Translates a static value whenever the target language changes
export function useAutoTranslated(text: string, targetLang = 'ht'): string {
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    const detected = detectLanguage(text);
    if (detected === targetLang || detected === 'unknown') { setTranslated(text); return; }
    TranslationEngine.translate({ text, targetLang, sourceLang: detected })
      .then(r => setTranslated(r.translated))
      .catch(() => setTranslated(text));
  }, [text, targetLang]);

  return translated;
}