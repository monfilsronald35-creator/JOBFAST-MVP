import { ReputationRepository } from '../repositories/VerificationRepository.js';
import type { ReputationScore, ReviewRecord } from '../types/reputation.types.js';

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function computeOverall(score: Omit<ReputationScore, 'overallScore' | 'trend' | 'lastCalculated'>): number {
  // Weighted composite
  const ratingNorm = (score.rating / 5) * 100;
  return clamp(
    ratingNorm       * 0.35 +
    score.successRate     * 0.25 +
    score.completionRate  * 0.20 +
    score.trustScore      * 0.10 +
    score.reliabilityScore * 0.10 -
    score.cancellationRate * 0.05 -
    score.complaintRate   * 0.05,
  );
}

export const ReputationEngine = {
  async get(userId: string): Promise<ReputationScore | null> {
    return ReputationRepository.get(userId);
  },

  async addReview(review: Omit<ReviewRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReviewRecord> {
    const saved = await ReputationRepository.addReview(review);
    await ReputationEngine.recalculate(review.userId);
    return saved;
  },

  async listReviews(userId: string, limit = 20): Promise<ReviewRecord[]> {
    return ReputationRepository.listReviews(userId, limit);
  },

  async recalculate(userId: string): Promise<ReputationScore> {
    const reviews = await ReputationRepository.listReviews(userId, 500);
    const prev    = await ReputationRepository.get(userId);

    const count     = reviews.length;
    const rating    = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    const verified  = reviews.filter(r => r.isVerified).length;
    const trustScore = count > 0 ? clamp((verified / count) * 100 + Math.min(count, 50)) : 0;
    const reliabilityScore = clamp(trustScore * 0.8 + Math.min(count * 2, 20));

    const partial: Omit<ReputationScore, 'overallScore' | 'trend' | 'lastCalculated'> = {
      userId,
      rating:           Math.round(rating * 100) / 100,
      reviewCount:      count,
      successRate:      count > 0 ? clamp((verified / count) * 110) : 0,
      completionRate:   100,
      cancellationRate: 0,
      complaintRate:    0,
      trustScore,
      reliabilityScore,
    };

    const overallScore = computeOverall(partial);
    const trend: ReputationScore['trend'] = prev
      ? overallScore > prev.overallScore + 1 ? 'up'
        : overallScore < prev.overallScore - 1 ? 'down'
        : 'stable'
      : 'stable';

    const score: ReputationScore = {
      ...partial,
      overallScore,
      trend,
      lastCalculated: new Date().toISOString(),
    };

    await ReputationRepository.upsert(score);
    return score;
  },
};
