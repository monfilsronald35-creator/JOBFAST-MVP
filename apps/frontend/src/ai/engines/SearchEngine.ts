import type { AISearchRequest, AISearchResult } from '../types';
import { AIGateway } from '../gateway/AIGateway';
import { detectLanguage } from '../prompt/AIPromptEngine';

export const SearchEngine = {
  async search(request: AISearchRequest): Promise<AISearchResult> {
    const start = Date.now();

    // Backend handles vector + semantic search
    try {
      const res = await fetch('/api/ai/search', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(request),
      });
      if (res.ok) return res.json() as Promise<AISearchResult>;
    } catch { /* fallback */ }

    // Client-side NLP interpretation fallback
    const interpreted = await this.interpretQuery(request.query, request.language);

    return {
      items:           [],
      query:           request.query,
      interpretedQuery: interpreted,
      suggestions:     [],
      facets:          {},
      totalResults:    0,
      searchLatencyMs: Date.now() - start,
    };
  },

  async interpretQuery(query: string, lang?: string): Promise<string> {
    const detectedLang = lang ?? detectLanguage(query);
    try {
      return await AIGateway.complete(
        `Interpret this search query semantically (return ONLY the interpreted English search terms, nothing else):\nQuery: "${query}"\nLanguage: ${detectedLang}`,
        { strategy: 'fastest', maxTokens: 50 },
      );
    } catch { return query; }
  },

  async embed(text: string): Promise<number[]> {
    return AIGateway.embed(text);
  },

  async imageSearch(imageData: string, limit = 10): Promise<AISearchResult> {
    try {
      const res = await fetch('/api/ai/search/image', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ imageData, limit }),
      });
      if (res.ok) return res.json() as Promise<AISearchResult>;
    } catch { /* */ }
    return { items: [], query: '[image]', totalResults: 0, searchLatencyMs: 0 };
  },

  async voiceSearch(audioData: string, language?: string): Promise<{ transcript: string; results: AISearchResult }> {
    try {
      const res = await fetch('/api/ai/search/voice', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ audioData, language }),
      });
      if (res.ok) return res.json() as Promise<{ transcript: string; results: AISearchResult }>;
    } catch { /* */ }
    return { transcript: '', results: { items: [], query: '', totalResults: 0, searchLatencyMs: 0 } };
  },

  async suggest(partial: string, domain?: string, limit = 5): Promise<string[]> {
    try {
      const res = await fetch(`/api/ai/search/suggest?q=${encodeURIComponent(partial)}&limit=${limit}${domain ? `&domain=${domain}` : ''}`);
      if (res.ok) return res.json() as Promise<string[]>;
    } catch { /* */ }
    return [];
  },
};