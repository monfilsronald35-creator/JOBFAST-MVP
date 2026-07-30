import { VerificationRepository } from '../repositories/VerificationRepository.js';
import { AppError } from '../../../core/errors/AppError.js';
import { VerificationType, VerificationStatus, type VerificationRecord, type DocumentRecord, type VerificationSummary } from '../types/verification.types.js';

export const VerificationService = {
  async getAll(userId: string): Promise<VerificationRecord[]> {
    return VerificationRepository.getByUserId(userId);
  },

  async getSummary(userId: string): Promise<VerificationSummary> {
    return VerificationRepository.getSummary(userId);
  },

  async submit(userId: string, type: VerificationType, metadata: Record<string, unknown> = {}): Promise<VerificationRecord> {
    return VerificationRepository.upsert(userId, type, VerificationStatus.Pending, { metadata });
  },

  async review(reviewerId: string, userId: string, type: VerificationType, decision: 'approve' | 'reject', opts: { reason?: string; expiresAt?: string } = {}): Promise<VerificationRecord> {
    const status = decision === 'approve' ? VerificationStatus.Approved : VerificationStatus.Rejected;
    return VerificationRepository.upsert(userId, type, status, {
      reviewedBy:       reviewerId,
      rejectionReason:  opts.reason,
      expiresAt:        opts.expiresAt,
    });
  },

  async revoke(userId: string, type: VerificationType): Promise<VerificationRecord> {
    return VerificationRepository.upsert(userId, type, VerificationStatus.Revoked, {});
  },

  // ——— Documents ————————————————————————————————————————————————————————————
  async uploadDocument(userId: string, doc: Omit<DocumentRecord, 'id' | 'userId' | 'uploadedAt' | 'isVerified'>): Promise<DocumentRecord> {
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (doc.fileSize > MAX_SIZE) throw new AppError('File too large (max 10 MB)', 400, 'FILE_TOO_LARGE');
    return VerificationRepository.addDocument(userId, doc);
  },

  async listDocuments(userId: string): Promise<DocumentRecord[]> {
    return VerificationRepository.listDocuments(userId);
  },

  async deleteDocument(userId: string, docId: string): Promise<void> {
    await VerificationRepository.deleteDocument(userId, docId);
  },
};
