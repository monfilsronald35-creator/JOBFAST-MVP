import type { PricingDecision, InventoryInsight, MarketplaceRanking } from '../types';
import { AIGateway } from '../gateway/AIGateway';

export const MarketplaceEngine = {
  async getDynamicPrice(listingId: string, params: {
    basePrice: number; category: string; demandScore?: number;
    competitorPrices?: number[]; inventory?: number; currency?: string;
  }): Promise<PricingDecision> {
    try {
      const res = await fetch('/api/ai/marketplace/price', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ listingId, ...params }),
      });
      if (res.ok) return res.json() as Promise<PricingDecision>;
    } catch { /* AI fallback */ }

    const { basePrice, category, demandScore = 50, competitorPrices = [], inventory } = params;
    const avgCompetitor = competitorPrices.length > 0
      ? competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length
      : basePrice;

    const prompt = `Set optimal price for:\nCategory: ${category}\nBase price: ${basePrice}\nDemand score: ${demandScore}/100\nCompetitor avg: ${avgCompetitor}\n${inventory !== undefined ? `Inventory: ${inventory}` : ''}\n\nReturn JSON: { suggestedPrice: number, minPrice: number, maxPrice: number, confidence: number, reason: string }`;

    return AIGateway.json<PricingDecision>(
      prompt,
      { strategy: 'fastest', temperature: 0 },
    ).catch(() => ({
      suggestedPrice: basePrice, minPrice: basePrice * 0.8, maxPrice: basePrice * 1.2,
      confidence: 50, reason: 'fallback to base price',
    }));
  },

  async getInventoryInsights(sellerId: string): Promise<InventoryInsight[]> {
    try {
      const res = await fetch(`/api/ai/marketplace/inventory?sellerId=${sellerId}`);
      if (res.ok) return res.json() as Promise<InventoryInsight[]>;
    } catch { /* */ }
    return [];
  },

  async rankListings(listingIds: string[], userId?: string, query?: string): Promise<MarketplaceRanking[]> {
    try {
      const res = await fetch('/api/ai/marketplace/rank', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ listingIds, userId, query }),
      });
      if (res.ok) return res.json() as Promise<MarketplaceRanking[]>;
    } catch { /* */ }
    return listingIds.map((id, i) => ({ listingId: id, rank: i + 1, score: 100 - i }));
  },

  async getCrossSellSuggestions(productId: string, userId?: string, limit = 4): Promise<string[]> {
    try {
      const res = await fetch(`/api/ai/marketplace/cross-sell?productId=${productId}&limit=${limit}${userId ? `&userId=${userId}` : ''}`);
      if (res.ok) return res.json() as Promise<string[]>;
    } catch { /* */ }
    return [];
  },

  async getUpsellSuggestions(productId: string, currentPrice: number, limit = 3): Promise<Array<{ productId: string; reason: string }>> {
    try {
      const res = await fetch(`/api/ai/marketplace/upsell?productId=${productId}&price=${currentPrice}&limit=${limit}`);
      if (res.ok) return res.json() as Promise<Array<{ productId: string; reason: string }>>;
    } catch { /* */ }
    return [];
  },

  async predictDemand(category: string, period: 'day' | 'week' | 'month'): Promise<{ predicted: number; confidence: number; trend: 'up' | 'down' | 'stable' }> {
    const prompt = `Predict demand for "${category}" over next ${period}. Return JSON: { predicted: number, confidence: 0-100, trend: "up"|"down"|"stable" }`;
    return AIGateway.json<{ predicted: number; confidence: number; trend: 'up' | 'down' | 'stable' }>(
      prompt,
      { strategy: 'fastest', temperature: 0 },
    ).catch(() => ({ predicted: 100, confidence: 40, trend: 'stable' as const }));
  },
};