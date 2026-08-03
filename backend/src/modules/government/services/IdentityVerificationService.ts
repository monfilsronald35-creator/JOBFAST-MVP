import { GovernmentRepository } from '../repositories/GovernmentRepository.js';
import { TypedEventBus }        from '../../../core/events/TypedEventBus.js';
import type { IdentityVerification, IdDocumentType } from '../types/government.types.js';

// Supported document types per local law (Haiti)
const ALLOWED_TYPES: IdDocumentType[] = ['national_id', 'passport', 'residence_permit', 'business_registration'];

// Default document validity in days
const DOC_VALIDITY: Record<IdDocumentType, number> = {
  passport:             3650,  // 10 years
  national_id:          3650,  // 10 years
  residence_permit:     365,
  business_registration: 365,
};

export const IdentityVerificationService = {
  async startVerification(userId: string, documentType: IdDocumentType): Promise<IdentityVerification> {
    if (!ALLOWED_TYPES.includes(documentType)) {
      throw new Error(`Tip dokiman ${documentType} pa sipòte kounye a.`);
    }
    const record = await GovernmentRepository.createVerification(userId, documentType);
    TypedEventBus.publish({ eventName: 'gov.identity.started', payload: { userId, documentType } });
    return record;
  },

  async verifyDocument(verificationId: string, documentNo: string): Promise<void> {
    // In production: call ONI (Ofis Nasyonal Idantifikasyon) API or passport authority
    // For now: pattern-validate and mark verified
    const isValid = documentNo.length >= 6;

    if (isValid) {
      const expiresAt = new Date(Date.now() + DOC_VALIDITY['national_id'] * 86400000).toISOString();
      await GovernmentRepository.updateVerification(verificationId, 'verified', { documentNo, expiresAt });
      TypedEventBus.publish({ eventName: 'gov.identity.verified', payload: { verificationId, documentNo } });
    } else {
      await GovernmentRepository.updateVerification(verificationId, 'failed', {
        failureReason: 'Nimewo dokiman an pa valid. Tanpri verifye epi eseye ankò.',
      });
      TypedEventBus.publish({ eventName: 'gov.identity.failed', payload: { verificationId } });
    }
  },

  async getStatus(userId: string): Promise<IdentityVerification | null> {
    return GovernmentRepository.getLatestVerification(userId);
  },

  getSupportedDocumentTypes(): IdDocumentType[] {
    return [...ALLOWED_TYPES];
  },
};