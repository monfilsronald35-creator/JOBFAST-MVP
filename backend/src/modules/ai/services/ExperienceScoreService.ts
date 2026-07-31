import { ExperienceRepository } from '../repositories/ExperienceRepository.js';
import type { ExperienceScore } from '../types/ai.types.js';

export const ExperienceScoreService = {
  async getToday(userId: string): Promise<ExperienceScore | null> {
    const today = new Date().toISOString().slice(0, 10);
    return ExperienceRepository.getScore(userId, today);
  },

  async record(userId: string, metric: keyof Omit<ExperienceScore, 'userId' | 'date' | 'overallScore'>, value: number): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const existing = await ExperienceRepository.getScore(userId, today) ?? {
      userId,
      date:               today,
      appSpeedScore:      0,
      searchSuccessRate:  0,
      bookingSuccessRate: 0,
      jobSuccessRate:     0,
      paymentSuccessRate: 0,
      avgResponseTimeMs:  0,
      notifOpenRate:      0,
      conversionRate:     0,
      overallScore:       0,
    };

    const updated: ExperienceScore = { ...existing, [metric]: value };

    // Compute overall as weighted average
    const weights = {
      appSpeedScore:      0.15,
      searchSuccessRate:  0.20,
      bookingSuccessRate: 0.15,
      jobSuccessRate:     0.20,
      paymentSuccessRate: 0.20,
      notifOpenRate:      0.05,
      conversionRate:     0.05,
    };
    updated.overallScore = Math.round(
      Object.entries(weights).reduce(
        (s, [k, w]) => s + (updated[k as keyof typeof weights] ?? 0) * w,
        0,
      ),
    );

    await ExperienceRepository.upsertScore(updated);
  },
};
