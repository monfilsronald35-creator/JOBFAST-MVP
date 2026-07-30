/**
 * AIRouter — Selects the best provider + model for each request.
 * Scores: cost * costWeight + speed * speedWeight + quality * qualityWeight
 * Local-first routing possible when privacy = true.
 */

import type {
  AIRequest, AIModelProvider, AIModelConfig, AIRoutingDecision,
} from '../types';

export interface RouterWeights {
  cost:    number; // 0-1
  speed:   number; // 0-1
  quality: number; // 0-1
}

const STRATEGY_WEIGHTS: Record<string, RouterWeights> = {
  cheapest:    { cost: 0.7,  speed: 0.2,  quality: 0.1  },
  fastest:     { cost: 0.1,  speed: 0.7,  quality: 0.2  },
  best_quality:{ cost: 0.1,  speed: 0.1,  quality: 0.8  },
  balanced:    { cost: 0.33, speed: 0.33, quality: 0.34 },
  private:     { cost: 0,    speed: 0,    quality: 0    }, // local only
};

export class AIRouter {
  private _providers: Map<string, AIModelProvider> = new Map();
  private _healthCache: Map<string, { ok: boolean; ts: number }> = new Map();

  register(provider: AIModelProvider): void {
    this._providers.set(provider.id, provider);
  }

  getProvider(id: string): AIModelProvider | null {
    return this._providers.get(id) ?? null;
  }

  getAllProviders(): AIModelProvider[] {
    return Array.from(this._providers.values());
  }

  async route(request: AIRequest): Promise<AIRoutingDecision> {
    const strategy = request.strategy ?? 'balanced';
    const weights  = STRATEGY_WEIGHTS[strategy] ?? STRATEGY_WEIGHTS.balanced!;
    const priority = request.priority;

    // If provider + model explicitly specified, use them
    if (request.provider && request.model) {
      const provider = this._providers.get(request.provider);
      if (!provider) throw new Error(`Provider ${request.provider} not registered`);
      const model = provider.models.find(m => m.id === request.model);
      return {
        provider:        request.provider,
        model:           request.model,
        reason:          'Explicitly requested',
        estimatedCost:   model ? this.estimateCost(model, 1000, 500) : 0,
        estimatedLatency: model?.avgLatencyMs ?? 0,
        scores:          { cost: 0, speed: 0, quality: 0 },
      };
    }

    // Private strategy → local provider only
    if (strategy === 'private' || priority === 'privacy') {
      const local = this._providers.get('local');
      if (local?.available) {
        const m = local.models[0];
        if (m) return { provider: 'local', model: m.id, reason: 'Privacy-first: local model', estimatedCost: 0, estimatedLatency: m.avgLatencyMs, scores: { cost: 100, speed: 50, quality: m.qualityScore } };
      }
    }

    // Gather all candidate models from available providers
    const candidates: Array<{ provider: AIModelProvider; model: AIModelConfig; score: number }> = [];

    for (const provider of this._providers.values()) {
      if (!provider.available) continue;
      if (strategy === 'private' && provider.id !== 'local') continue;

      const health = await this.checkHealth(provider);
      if (!health) continue;

      for (const model of provider.models) {
        // Filter by required capabilities
        if (request.context && !this.meetsCapabilities(model, request)) continue;

        const costScore    = this.scoreCost(model);
        const speedScore   = this.scoreSpeed(model);
        const qualityScore = model.qualityScore;

        let score: number;
        if (strategy === 'private') {
          score = model.localOnly ? 100 : 0;
        } else {
          score = weights.cost * costScore + weights.speed * speedScore + weights.quality * qualityScore;
        }

        candidates.push({ provider, model, score });
      }
    }

    if (candidates.length === 0) throw new Error('No AI providers available');

    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0]!;

    return {
      provider:         best.provider.id,
      model:            best.model.id,
      reason:           `Strategy: ${strategy}, score: ${best.score.toFixed(1)}`,
      estimatedCost:    this.estimateCost(best.model, 1000, 500),
      estimatedLatency: best.model.avgLatencyMs,
      scores: {
        cost:    this.scoreCost(best.model),
        speed:   this.scoreSpeed(best.model),
        quality: best.model.qualityScore,
      },
    };
  }

  private meetsCapabilities(model: AIModelConfig, req: AIRequest): boolean {
    if (req.stream && !model.supportsStreaming)  return false;
    if (req.functions?.length && !model.capabilities.includes('function_calling')) return false;
    // Check vision if any message has image content
    const hasImage = req.messages.some(m => Array.isArray(m.content) && m.content.some(p => p.type === 'image_url'));
    if (hasImage && !model.supportsVision) return false;
    return true;
  }

  private scoreCost(model: AIModelConfig): number {
    // Invert cost (cheaper = higher score). Max cost reference: $0.1/1k tokens
    const cost = (model.inputCostPer1k + model.outputCostPer1k) / 2;
    return Math.max(0, 100 - (cost / 0.1) * 100);
  }

  private scoreSpeed(model: AIModelConfig): number {
    // Invert latency (faster = higher score). Max latency reference: 3000ms
    return Math.max(0, 100 - (model.avgLatencyMs / 3000) * 100);
  }

  private estimateCost(model: AIModelConfig, inputTokens: number, outputTokens: number): number {
    return (model.inputCostPer1k * inputTokens + model.outputCostPer1k * outputTokens) / 1000;
  }

  private async checkHealth(provider: AIModelProvider): Promise<boolean> {
    const cached = this._healthCache.get(provider.id);
    if (cached && Date.now() - cached.ts < 60_000) return cached.ok;
    const ok = await provider.health().catch(() => false);
    this._healthCache.set(provider.id, { ok, ts: Date.now() });
    return ok;
  }
}