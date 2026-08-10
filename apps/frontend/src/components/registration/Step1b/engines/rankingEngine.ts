// ─── Ranking Engine ───────────────────────────────────────────────────────────
// Multi-signal scoring. Weights are tunable per market segment.
// When backend ML is available, weights are fetched from /api/v1/ranking/weights.

import type { RankingSignals } from '../types/business';

export interface RankingInput {
  relevance: number;        // 0–1: query match score
  distanceKm?: number;      // null if no GPS
  availabilityScore: number;// 0–1: online/busy/away/offline
  trustScore: number;       // 0–1: verification completeness
  ratingScore: number;      // 0–1: normalized star rating
  responseScore: number;    // 0–1: response time (inverse)
  verificationScore: number;// 0–1: document/license verification
  personalizationScore?: number; // 0–1: user history affinity
  demandScore?: number;     // 0–1: category global demand
}

// Default weights — learnable via backend
const DEFAULT_WEIGHTS = {
  relevance: 0.30,
  distance: 0.15,
  availability: 0.10,
  trust: 0.15,
  rating: 0.10,
  response: 0.08,
  verification: 0.07,
  personalization: 0.05,
};

function distanceScore(km?: number): number {
  if (km === undefined || km === null) return 0.5; // neutral when no GPS
  if (km < 1) return 1.0;
  if (km < 5) return 0.9;
  if (km < 20) return 0.7;
  if (km < 50) return 0.5;
  if (km < 200) return 0.3;
  return 0.1;
}

export function computeRankingScore(input: RankingInput): RankingSignals {
  const w = DEFAULT_WEIGHTS;

  const dist = distanceScore(input.distanceKm);
  const personalization = input.personalizationScore ?? 0.5;

  const totalScore = Math.round((
    input.relevance          * w.relevance +
    dist                     * w.distance +
    input.availabilityScore  * w.availability +
    input.trustScore         * w.trust +
    input.ratingScore        * w.rating +
    input.responseScore      * w.response +
    input.verificationScore  * w.verification +
    personalization          * w.personalization
  ) * 100);

  return {
    relevance: input.relevance,
    distanceScore: dist,
    availabilityScore: input.availabilityScore,
    trustScore: input.trustScore,
    ratingScore: input.ratingScore,
    responseScore: input.responseScore,
    verificationScore: input.verificationScore,
    personalizationScore: personalization,
    totalScore,
  };
}

export function normalizeRating(rating: number, maxRating = 5): number {
  return Math.max(0, Math.min(1, rating / maxRating));
}

export function responseTimeScore(seconds: number): number {
  if (seconds < 60) return 1.0;
  if (seconds < 300) return 0.85;
  if (seconds < 1800) return 0.65;
  if (seconds < 86400) return 0.40;
  return 0.10;
}

export function availabilityToScore(status: string): number {
  const map: Record<string, number> = {
    online: 1.0, busy: 0.7, away: 0.4, offline: 0.1, closed: 0.0,
  };
  return map[status] ?? 0.5;
}
