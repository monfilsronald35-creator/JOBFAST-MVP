/**
 * AIGateway — Single entry point for all AI requests.
 * Handles routing, caching, security, cost tracking, memory injection.
 */

import type {
  AIRequest,
  AIResponse,
  AIStreamChunk,
  AIModelProvider,
  AIRoutingDecision,
  AIUsageRecord,
} from '../types';
import { AIRouter } from './AIRouter';
import { createOpenAIProvider } from './providers/OpenAIProvider';
import { createAnthropicProvider } from './providers/AnthropicProvider';
import { createGeminiProvider } from './providers/GeminiProvider';
import { createMistralProvider } from './providers/MistralProvider';
import { createDeepSeekProvider } from './providers/DeepSeekProvider';
import { createLocalProvider } from './providers/LocalProvider';

const CACHE_TTL = 5 * 60_000; // 5 min semantic cache

class AIGatewayImpl {
  private router: AIRouter = new AIRouter();
  private cache: Map<string, { response: AIResponse; ts: number }> = new Map();
  private usage: AIUsageRecord[] = [];
  private listeners: Set<(record: AIUsageRecord) => void> = new Set();

  // ─── Bootstrap ────────────────────────────────────────────────────────────

  constructor() {
    this.router.register(createOpenAIProvider());
    this.router.register(createAnthropicProvider());
    this.router.register(createGeminiProvider());
    this.router.register(createMistralProvider());
    this.router.register(createDeepSeekProvider());
    this.router.register(createLocalProvider());
  }

  registerProvider(provider: AIModelProvider): void {
    this.router.register(provider);
  }

  // ─── Chat ─────────────────────────────────────────────────────────────────

  async chat(request: AIRequest): Promise<AIResponse> {
    // Semantic cache
    if (request.cacheKey) {
      const hit = this.cache.get(request.cacheKey);
      if (hit && Date.now() - hit.ts < CACHE_TTL) {
        return { ...hit.response, cached: true };
      }
    }

    const decision = await this.router.route(request);
    const provider = this.router.getProvider(decision.provider);
    if (!provider) throw new Error(`Provider ${decision.provider} not found`);

    const enriched: AIRequest = {
      ...request,
      model: request.model ?? decision.model,
      provider: request.provider ?? decision.provider,
    };

    const start = Date.now();
    const response = await provider.chat(enriched);
    const latency = Date.now() - start;

    if (request.cacheKey) {
      this.cache.set(request.cacheKey, { response, ts: Date.now() });
    }

    void this.trackUsage({ ...response, latencyMs: latency }, request, decision);
    return response;
  }

  // ─── Streaming ────────────────────────────────────────────────────────────

  async *stream(request: AIRequest): AsyncGenerator<AIStreamChunk> {
    const decision = await this.router.route({ ...request, stream: true });
    const provider = this.router.getProvider(decision.provider);
    if (!provider) throw new Error(`Provider ${decision.provider} not found`);

    const enriched: AIRequest = {
      ...request,
      model: request.model ?? decision.model,
      provider: request.provider ?? decision.provider,
      stream: true,
    };

    yield* provider.stream(enriched);
  }

  // ─── Embedding ────────────────────────────────────────────────────────────

  async embed(text: string, providerId = 'openai'): Promise<number[]> {
    const provider = this.router.getProvider(providerId);
    if (!provider) {
      // Fallback to any available provider
      for (const p of this.router.getAllProviders()) {
        if (p.available) return p.embed(text);
      }
      throw new Error('No provider available for embedding');
    }
    return provider.embed(text);
  }

  // ─── Convenience wrappers ─────────────────────────────────────────────────

  async complete(prompt: string, options?: Partial<AIRequest>): Promise<string> {
    const res = await this.chat({
      messages: [{ role: 'user', content: prompt }],
      ...options,
    });
    return res.content;
  }

  async json<T>(prompt: string, options?: Partial<AIRequest>): Promise<T> {
    const res = await this.chat({
      messages: [{ role: 'user', content: `${prompt}\n\nRespond ONLY with valid JSON.` }],
      responseFormat: 'json',
      temperature: 0,
      ...options,
    });
    return JSON.parse(res.content) as T;
  }

  // ─── Routing info ─────────────────────────────────────────────────────────

  async getRoutingDecision(request: AIRequest): Promise<AIRoutingDecision> {
    return this.router.route(request);
  }

  getAvailableProviders(): AIModelProvider[] {
    return this.router.getAllProviders().filter((p) => p.available);
  }

  // ─── Usage tracking ───────────────────────────────────────────────────────

  private trackUsage(response: AIResponse, request: AIRequest, decision: AIRoutingDecision): void {
    const record: AIUsageRecord = {
      requestId: response.id,
      ...(request.context?.userId !== undefined ? { userId: request.context.userId } : {}),
      model: response.model,
      provider: response.provider,
      domain: request.context?.domain ?? 'general',
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      costUSD: response.costUSD,
      latencyMs: response.latencyMs,
      cached: response.cached,
      timestamp: Date.now(),
    };
    this.usage.push(record);
    this.listeners.forEach((fn) => fn(record));
    // Keep last 500 records in memory
    if (this.usage.length > 500) this.usage.shift();
  }

  onUsage(fn: (record: AIUsageRecord) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getUsageHistory(): AIUsageRecord[] {
    return [...this.usage];
  }
  clearCache(): void {
    this.cache.clear();
  }

  getTotalCost(since?: number): number {
    const cutoff = since ?? 0;
    return this.usage.filter((r) => r.timestamp >= cutoff).reduce((sum, r) => sum + r.costUSD, 0);
  }
}

export const AIGateway = new AIGatewayImpl();
