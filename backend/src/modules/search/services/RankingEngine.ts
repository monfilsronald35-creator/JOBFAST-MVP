import type { SearchResult, RankingFactors } from '../types/search.types.js';
import { RANKING_WEIGHTS } from '../types/search.types.js';

function factorScore(value: number, max: number): number {
  return Math.min(100, Math.max(0, (value / max) * 100));
}

function computeFactors(result: SearchResult, userLat?: number, userLng?: number): RankingFactors {
  const relevance     = result.score;
  const verification  = result.isVerified ? 100 : 0;
  const rating        = result.rating != null ? (result.rating / 5) * 100 : 50;
  const premiumBoost  = (result.metadata?.['isPremium'] === true) ? 100 : 0;
  const availability  = 100; // already filtered by is_available

  let distance = 50; // neutral when no location
  if (userLat != null && result.lat != null && result.distanceKm != null) {
    distance = Math.max(0, 100 - (result.distanceKm / 50) * 100);
  }

  const popularity     = factorScore(Number(result.metadata?.['popularity'] ?? 0), 10000);
  const completionRate = factorScore(Number(result.metadata?.['completionRate'] ?? 50), 100);

  let priceScore = 50;
  if (result.price != null) {
    // Inverse: cheaper = higher score. Normalize against 10000 HTG
    priceScore = Math.max(0, 100 - factorScore(result.price, 1_000_000));
  }

  return { relevance, distance, rating, verification, availability, priceScore, popularity, completionRate, premiumBoost };
}

function compositeScore(factors: RankingFactors): number {
  return Object.entries(RANKING_WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + (factors[key as keyof RankingFactors] ?? 0) * weight;
  }, 0);
}

export const RankingEngine = {
  rank(results: SearchResult[], userLat?: number, userLng?: number): SearchResult[] {
    return results
      .map(r => {
        const factors = computeFactors(r, userLat, userLng);
        return {
          ...r,
          score:          compositeScore(factors),
          rankingFactors: factors as unknown as Record<string, number>,
        };
      })
      .sort((a, b) => b.score - a.score);
  },
};