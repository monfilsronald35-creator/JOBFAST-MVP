import { ReputationRepository } from '../repositories/VerificationRepository.js';
import { VerificationRepository } from '../repositories/VerificationRepository.js';
import { ProfileRepository } from '../repositories/ProfileRepository.js';
import { AppError } from '../../../core/errors/AppError.js';
import type { AIProfileScore } from '../types/reputation.types.js';
import { VerificationStatus } from '../types/verification.types.js';

function clamp(n: number): number { return Math.max(0, Math.min(100, n)); }

export const AIProfileEngine = {
  async analyze(userId: string): Promise<AIProfileScore> {
    const [profile, verifications, reputation] = await Promise.all([
      ProfileRepository.findByUserId(userId),
      VerificationRepository.getByUserId(userId),
      ReputationRepository.get(userId),
    ]);

    if (!profile) throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');

    // ——— Completeness ————————————————————————————————————————————
    let complete = 0;
    if (profile.displayName || profile.businessName) complete += 10;
    if (profile.headline)        complete += 10;
    if (profile.bio && profile.bio.length > 50) complete += 10;
    if ((profile.skills ?? []).length >= 3)      complete += 15;
    if ((profile.experience ?? []).length >= 1)  complete += 15;
    if ((profile.education ?? []).length >= 1)   complete += 10;
    if (profile.whatsapp || profile.website)     complete += 10;
    if ((profile.languages ?? []).length >= 1)   complete += 5;
    if (profile.nationality)     complete += 5;
    if (profile.jobTitle || profile.profession)  complete += 10;
    const completenessScore = clamp(complete);

    // ——— Verification factor ————————————————————————————————————
    const approvedCount = verifications.filter(v => v.status === VerificationStatus.Approved).length;
    const verificationBonus = Math.min(approvedCount * 8, 40);

    // ——— Trust ——————————————————————————————————————————————————
    const trustScore = clamp(verificationBonus + (reputation ? reputation.trustScore * 0.4 : 0) + (completenessScore * 0.2));

    // ——— Visibility ——————————————————————————————————————————————
    let visibility = completenessScore * 0.5;
    if ((profile.skills ?? []).length >= 5) visibility += 10;
    if ((profile.languages ?? []).length >= 2) visibility += 5;
    if (profile.isPublic) visibility += 10;
    const visibilityScore = clamp(visibility);

    // ——— Hiring probability ——————————————————————————————————————
    const repScore = reputation?.overallScore ?? 0;
    const hiringProbability = clamp(completenessScore * 0.4 + repScore * 0.35 + trustScore * 0.25);

    // ——— Marketplace score ———————————————————————————————————————
    const marketplaceScore = clamp(completenessScore * 0.3 + repScore * 0.4 + visibilityScore * 0.3);

    // ——— Overall ——————————————————————————————————————————————————
    const aiScore = clamp(
      completenessScore * 0.25 +
      hiringProbability * 0.25 +
      marketplaceScore  * 0.20 +
      trustScore        * 0.15 +
      visibilityScore   * 0.15,
    );

    // ——— Strengths & weaknesses ————————————————————————————————
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];

    if ((profile.skills ?? []).length >= 5) strengths.push('Rich skills profile');
    if (approvedCount >= 2)                 strengths.push('Verified identity');
    if (repScore >= 80)                     strengths.push('Excellent reputation');
    if ((profile.experience ?? []).length >= 3) strengths.push('Solid work experience');

    if (!profile.bio || profile.bio.length < 50) {
      weaknesses.push('Incomplete bio');
      suggestions.push('Add a detailed bio (minimum 50 characters)');
    }
    if ((profile.skills ?? []).length < 3) {
      weaknesses.push('Few skills listed');
      suggestions.push('Add at least 3 skills to increase search visibility');
    }
    if (approvedCount === 0) {
      weaknesses.push('No verified identity');
      suggestions.push('Verify your email and phone number');
    }
    if (!profile.headline) {
      suggestions.push('Add a professional headline');
    }
    if ((profile.experience ?? []).length === 0) {
      suggestions.push('Add work experience to increase hiring probability');
    }

    const score: AIProfileScore = {
      userId,
      aiScore:           Math.round(aiScore),
      hiringProbability: Math.round(hiringProbability),
      marketplaceScore:  Math.round(marketplaceScore),
      trustScore:        Math.round(trustScore),
      visibilityScore:   Math.round(visibilityScore),
      completenessScore: Math.round(completenessScore),
      strengths,
      weaknesses,
      suggestedImprovements: suggestions,
      lastAnalyzed: new Date().toISOString(),
    };

    await ReputationRepository.saveAIScore(score);
    return score;
  },

  async getCached(userId: string): Promise<AIProfileScore | null> {
    return ReputationRepository.getAIScore(userId);
  },
};
