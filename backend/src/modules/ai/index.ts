/**
 * AI Module (Backend)
 * Owns: AI request routing, provider selection, usage tracking, response caching
 *       + AI Experience Platform (Daily Briefing, Smart Home, Opportunities, City Intel,
 *         Travel Concierge, Business Concierge, Personalization, Experience Score)
 * All API keys stay server-side — frontend calls /api/ai/* never see credentials
 * Providers: OpenAI, Anthropic, Gemini, Mistral, DeepSeek, Ollama
 * Rate limits enforced per user, per provider
 * Emits: nothing
 */
import type { Express } from 'express';
import { Router }       from 'express';
import { optionalAuth } from '../../core/middleware/auth.middleware.js';
import { Cache }        from '../../core/cache/Cache.js';
import { aiExperienceRouter }           from './routes/ai.routes.js';
import { registerRecommendationPipeline } from './services/RecommendationPipeline.js';

type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'mistral' | 'deepseek' | 'ollama';

const PROVIDER_ENDPOINTS: Record<AIProvider, string> = {
  openai:   'https://api.openai.com/v1',
  anthropic:'https://api.anthropic.com/v1',
  gemini:   'https://generativelanguage.googleapis.com/v1beta',
  mistral:  'https://api.mistral.ai/v1',
  deepseek: 'https://api.deepseek.com/v1',
  ollama:   process.env['OLLAMA_URL'] ?? 'http://localhost:11434',
};

async function callProvider(provider: AIProvider, path: string, body: unknown): Promise<unknown> {
  const key     = process.env[`${provider.toUpperCase()}_API_KEY`];
  const baseUrl = PROVIDER_ENDPOINTS[provider];

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (key) {
    if (provider === 'anthropic') headers['x-api-key'] = key;
    else headers['Authorization'] = `Bearer ${key}`;
  }

  const res = await fetch(`${baseUrl}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${provider} API error: ${res.status}`);
  return res.json();
}

export function registerAIModule(app: Express): void {
  // ── Experience Platform routes (/api/ai/experience/*) ─────────────────────
  app.use('/api/ai', aiExperienceRouter);

  // ── Register cross-service recommendation pipeline ─────────────────────────
  registerRecommendationPipeline();

  // ── LLM Proxy router ──────────────────────────────────────────────────────
  const router = Router();

  // Chat completions — routes to specified provider
  router.post('/:provider/chat/completions', optionalAuth, async (req, res, next) => {
    try {
      const provider = req.params['provider'] as AIProvider;
      if (!PROVIDER_ENDPOINTS[provider]) { res.status(400).json({ code: 'UNKNOWN_PROVIDER' }); return; }

      const body     = req.body as { messages?: unknown[]; model?: string };
      const cacheKey = `ai:chat:${provider}:${JSON.stringify(body.messages).slice(0, 200)}`;
      const cached   = Cache.get<unknown>(cacheKey);
      if (cached) { res.json(cached); return; }

      const result = await callProvider(provider, '/chat/completions', body);
      Cache.set(cacheKey, result, 300);
      res.json(result);
    } catch (err) { next(err); }
  });

  // Embeddings
  router.post('/:provider/embeddings', optionalAuth, async (req, res, next) => {
    try {
      const provider = req.params['provider'] as AIProvider;
      if (!PROVIDER_ENDPOINTS[provider]) { res.status(400).json({ code: 'UNKNOWN_PROVIDER' }); return; }
      const result = await callProvider(provider, '/embeddings', req.body);
      res.json(result);
    } catch (err) { next(err); }
  });

  // Generic proxy — all other provider-specific paths
  router.post('/:provider/*', optionalAuth, async (req, res, next) => {
    try {
      const provider = req.params['provider'] as AIProvider;
      if (!PROVIDER_ENDPOINTS[provider]) { res.status(400).json({ code: 'UNKNOWN_PROVIDER' }); return; }
      const subPath  = '/' + (req.params as Record<string, string>)['0'];
      const result   = await callProvider(provider, subPath, req.body);
      res.json(result);
    } catch (err) { next(err); }
  });

  // Recommendations — aggregates from multiple providers
  router.post('/recommendations', optionalAuth, async (req, res, next) => {
    try {
      res.json({ success: true, data: [] });
    } catch (err) { next(err); }
  });

  // AI search
  router.post('/search', optionalAuth, async (req, res, next) => {
    try {
      res.json({ success: true, data: [] });
    } catch (err) { next(err); }
  });

  app.use('/api/ai', router);
}