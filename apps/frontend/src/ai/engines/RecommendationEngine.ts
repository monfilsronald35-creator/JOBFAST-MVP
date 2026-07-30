import type { RecommendationRequest, RecommendationItem } from '../types';
import { AIGateway } from '../gateway/AIGateway';
import { PROMPT_TEMPLATES } from '../prompt/AIPromptEngine';

export const RecommendationEngine = {
  async recommend(request: RecommendationRequest): Promise<RecommendationItem[]> {
    try {
      const res = await fetch('/api/ai/recommendations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(request),
      });
      if (res.ok) return res.json() as Promise<RecommendationItem[]>;
    } catch { /* fallback to AI */ }

    const history = JSON.stringify(request.context ?? {});
    const prompt  = PROMPT_TEMPLATES.recommendItems(request.userId, request.domain, history);
    const result  = await AIGateway.json<{ recommendations: Array<{ id: string; reason: string; score: number }> }>(
      prompt,
      { strategy: 'fastest', context: { userId: request.userId, domain: request.domain } },
    ).catch(() => ({ recommendations: [] }));

    return result.recommendations.map(r => ({
      id:       r.id,
      domain:   request.domain,
      title:    r.id,
      score:    r.score,
      reason:   r.reason,
      metadata: {},
    }));
  },

  async getPersonalizedFeed(userId: string, domains: RecommendationRequest['domain'][]): Promise<Map<string, RecommendationItem[]>> {
    const results = await Promise.all(
      domains.map(domain => this.recommend({ userId, domain, limit: 5 }).then(items => [domain, items] as const)),
    );
    return new Map(results);
  },

  async getSimilarItems(itemId: string, domain: string, limit = 5): Promise<RecommendationItem[]> {
    try {
      const res = await fetch(`/api/ai/recommendations/similar?itemId=${itemId}&domain=${domain}&limit=${limit}`);
      if (res.ok) return res.json() as Promise<RecommendationItem[]>;
    } catch { /* */ }
    return [];
  },
};