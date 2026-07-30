import { db } from '../../../core/database/SupabaseClient.js';
import { AppError } from '../../../core/errors/AppError.js';
import {
  VerificationType, VerificationStatus,
  type VerificationRecord, type DocumentRecord, type VerificationSummary,
} from '../types/verification.types.js';
import type { ReputationScore, AIProfileScore, ReviewRecord } from '../types/reputation.types.js';

// ——— Verification ——————————————————————————————————————————————————————————
function toVerification(row: Record<string, unknown>): VerificationRecord {
  return {
    id:               row['id'] as string,
    userId:           row['user_id'] as string,
    type:             row['type'] as VerificationType,
    status:           row['status'] as VerificationStatus,
    submittedAt:      row['submitted_at'] as string | undefined,
    reviewedAt:       row['reviewed_at'] as string | undefined,
    expiresAt:        row['expires_at'] as string | undefined,
    reviewedBy:       row['reviewed_by'] as string | undefined,
    rejectionReason:  row['rejection_reason'] as string | undefined,
    metadata:         (row['metadata'] as Record<string, unknown>) ?? {},
    createdAt:        row['created_at'] as string,
    updatedAt:        row['updated_at'] as string,
  };
}

function toDocument(row: Record<string, unknown>): DocumentRecord {
  return {
    id:         row['id'] as string,
    userId:     row['user_id'] as string,
    type:       row['type'] as DocumentRecord['type'],
    fileName:   row['file_name'] as string,
    fileUrl:    row['file_url'] as string,
    fileSize:   row['file_size'] as number,
    mimeType:   row['mime_type'] as string,
    isVerified: row['is_verified'] as boolean,
    expiresAt:  row['expires_at'] as string | undefined,
    metadata:   (row['metadata'] as Record<string, unknown>) ?? {},
    uploadedAt: row['uploaded_at'] as string,
  };
}

export const VerificationRepository = {
  async upsert(userId: string, type: VerificationType, status: VerificationStatus, opts: { rejectionReason?: string; expiresAt?: string; reviewedBy?: string; metadata?: Record<string, unknown> } = {}): Promise<VerificationRecord> {
    const now = new Date().toISOString();
    const row: Record<string, unknown> = {
      user_id:    userId,
      type,
      status,
      updated_at: now,
    };
    if (status === VerificationStatus.Pending)  row['submitted_at']    = now;
    if (status === VerificationStatus.Approved || status === VerificationStatus.Rejected) row['reviewed_at'] = now;
    if (opts.rejectionReason !== undefined) row['rejection_reason'] = opts.rejectionReason;
    if (opts.expiresAt       !== undefined) row['expires_at']       = opts.expiresAt;
    if (opts.reviewedBy      !== undefined) row['reviewed_by']      = opts.reviewedBy;
    if (opts.metadata        !== undefined) row['metadata']         = opts.metadata;

    const { data, error } = await db.client()
      .from('user_verifications')
      .upsert(row, { onConflict: 'user_id,type' })
      .select('*')
      .single<Record<string, unknown>>();

    if (error ?? !data) throw new AppError('Failed to save verification', 500, 'DB_ERROR');
    return toVerification(data);
  },

  async getByUserId(userId: string): Promise<VerificationRecord[]> {
    const { data, error } = await db.client()
      .from('user_verifications')
      .select('*')
      .eq('user_id', userId)
      .returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to load verifications', 500, 'DB_ERROR');
    return (data ?? []).map(toVerification);
  },

  async getSummary(userId: string): Promise<VerificationSummary> {
    const records = await VerificationRepository.getByUserId(userId);
    const approved = new Set(
      records
        .filter(r => r.status === VerificationStatus.Approved)
        .map(r => r.type)
    );

    const summary: VerificationSummary = {
      email:      approved.has(VerificationType.Email),
      phone:      approved.has(VerificationType.Phone),
      identity:   approved.has(VerificationType.Identity),
      address:    approved.has(VerificationType.Address),
      business:   approved.has(VerificationType.Business),
      government: approved.has(VerificationType.Government),
      banking:    approved.has(VerificationType.Banking),
      kyc:        approved.has(VerificationType.KYC),
      kyb:        approved.has(VerificationType.KYB),
      overallLevel: 'unverified',
      trustBadge:   'none',
    };

    const count = approved.size;
    const hasKyc = summary.kyc || summary.kyb;
    const hasIdentity = summary.identity || summary.government;

    if (count === 0) {
      summary.overallLevel = 'unverified';
      summary.trustBadge   = 'none';
    } else if (summary.email && summary.phone) {
      summary.overallLevel = 'basic';
      summary.trustBadge   = 'verified';
    } else if (summary.email && summary.phone && hasIdentity) {
      summary.overallLevel = 'standard';
      summary.trustBadge   = 'verified';
    } else if (hasKyc && hasIdentity && summary.banking) {
      summary.overallLevel = 'advanced';
      summary.trustBadge   = 'trusted';
    } else if (hasKyc && summary.kyb && count >= 7) {
      summary.overallLevel = 'enterprise';
      summary.trustBadge   = 'certified';
    }

    return summary;
  },

  // ——— Documents ————————————————————————————————————————————————————————————
  async addDocument(userId: string, doc: Omit<DocumentRecord, 'id' | 'userId' | 'uploadedAt' | 'isVerified'>): Promise<DocumentRecord> {
    const { data, error } = await db.client()
      .from('user_documents')
      .insert({
        user_id:    userId,
        type:       doc.type,
        file_name:  doc.fileName,
        file_url:   doc.fileUrl,
        file_size:  doc.fileSize,
        mime_type:  doc.mimeType,
        expires_at: doc.expiresAt ?? null,
        metadata:   doc.metadata ?? {},
      })
      .select('*')
      .single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to save document', 500, 'DB_ERROR');
    return toDocument(data);
  },

  async listDocuments(userId: string): Promise<DocumentRecord[]> {
    const { data, error } = await db.client()
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })
      .returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list documents', 500, 'DB_ERROR');
    return (data ?? []).map(toDocument);
  },

  async deleteDocument(userId: string, docId: string): Promise<void> {
    const { error } = await db.client()
      .from('user_documents')
      .delete()
      .eq('id', docId)
      .eq('user_id', userId);
    if (error) throw new AppError('Failed to delete document', 500, 'DB_ERROR');
  },
};

// ——— Reputation ——————————————————————————————————————————————————————————————

function toReputation(row: Record<string, unknown>): ReputationScore {
  return {
    userId:           row['user_id'] as string,
    rating:           Number(row['rating']),
    reviewCount:      Number(row['review_count']),
    successRate:      Number(row['success_rate']),
    completionRate:   Number(row['completion_rate']),
    cancellationRate: Number(row['cancellation_rate']),
    complaintRate:    Number(row['complaint_rate']),
    trustScore:       Number(row['trust_score']),
    reliabilityScore: Number(row['reliability_score']),
    overallScore:     Number(row['overall_score']),
    trend:            row['trend'] as ReputationScore['trend'],
    lastCalculated:   row['last_calculated'] as string,
  };
}

export const ReputationRepository = {
  async get(userId: string): Promise<ReputationScore | null> {
    const { data } = await db.client()
      .from('user_reputation')
      .select('*')
      .eq('user_id', userId)
      .single<Record<string, unknown>>();
    return data ? toReputation(data) : null;
  },

  async upsert(score: ReputationScore): Promise<void> {
    await db.client().from('user_reputation').upsert({
      user_id:           score.userId,
      rating:            score.rating,
      review_count:      score.reviewCount,
      success_rate:      score.successRate,
      completion_rate:   score.completionRate,
      cancellation_rate: score.cancellationRate,
      complaint_rate:    score.complaintRate,
      trust_score:       score.trustScore,
      reliability_score: score.reliabilityScore,
      overall_score:     score.overallScore,
      trend:             score.trend,
      last_calculated:   score.lastCalculated,
    }, { onConflict: 'user_id' }).select();
  },

  async addReview(review: Omit<ReviewRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReviewRecord> {
    const { data, error } = await db.client()
      .from('user_reviews')
      .insert({
        user_id:     review.userId,
        reviewer_id: review.reviewerId,
        rating:      review.rating,
        comment:     review.comment ?? null,
        context:     review.context,
        context_id:  review.contextId ?? null,
        is_verified: review.isVerified,
      })
      .select('*')
      .single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to save review', 500, 'DB_ERROR');
    return {
      id:         data['id'] as string,
      userId:     data['user_id'] as string,
      reviewerId: data['reviewer_id'] as string,
      rating:     Number(data['rating']),
      comment:    data['comment'] as string | undefined,
      context:    data['context'] as ReviewRecord['context'],
      contextId:  data['context_id'] as string | undefined,
      isVerified: data['is_verified'] as boolean,
      createdAt:  data['created_at'] as string,
      updatedAt:  data['updated_at'] as string,
    };
  },

  async listReviews(userId: string, limit = 20): Promise<ReviewRecord[]> {
    const { data, error } = await db.client()
      .from('user_reviews')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list reviews', 500, 'DB_ERROR');
    return (data ?? []).map(row => ({
      id:         row['id'] as string,
      userId:     row['user_id'] as string,
      reviewerId: row['reviewer_id'] as string,
      rating:     Number(row['rating']),
      comment:    row['comment'] as string | undefined,
      context:    row['context'] as ReviewRecord['context'],
      contextId:  row['context_id'] as string | undefined,
      isVerified: row['is_verified'] as boolean,
      createdAt:  row['created_at'] as string,
      updatedAt:  row['updated_at'] as string,
    }));
  },

  // ——— AI Scores ————————————————————————————————————————————————————————————
  async getAIScore(userId: string): Promise<AIProfileScore | null> {
    const { data } = await db.client()
      .from('user_ai_scores')
      .select('*')
      .eq('user_id', userId)
      .single<Record<string, unknown>>();
    if (!data) return null;
    return {
      userId:            data['user_id'] as string,
      aiScore:           Number(data['ai_score']),
      hiringProbability: Number(data['hiring_probability']),
      marketplaceScore:  Number(data['marketplace_score']),
      trustScore:        Number(data['trust_score']),
      visibilityScore:   Number(data['visibility_score']),
      completenessScore: Number(data['completeness_score']),
      strengths:         (data['strengths'] as string[]) ?? [],
      weaknesses:        (data['weaknesses'] as string[]) ?? [],
      suggestedImprovements: (data['suggested_improvements'] as string[]) ?? [],
      lastAnalyzed:      data['last_analyzed'] as string,
    };
  },

  async saveAIScore(score: AIProfileScore): Promise<void> {
    await db.client().from('user_ai_scores').upsert({
      user_id:               score.userId,
      ai_score:              score.aiScore,
      hiring_probability:    score.hiringProbability,
      marketplace_score:     score.marketplaceScore,
      trust_score:           score.trustScore,
      visibility_score:      score.visibilityScore,
      completeness_score:    score.completenessScore,
      strengths:             score.strengths,
      weaknesses:            score.weaknesses,
      suggested_improvements: score.suggestedImprovements,
      last_analyzed:         score.lastAnalyzed,
    }, { onConflict: 'user_id' }).select();
  },
};
