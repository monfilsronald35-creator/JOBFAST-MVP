import { GovernmentRepository } from '../repositories/GovernmentRepository.js';
import { TypedEventBus }        from '../../../core/events/TypedEventBus.js';
import type { GovernmentPermit, PermitType } from '../types/government.types.js';

function generateRef(prefix: string, id: string): string {
  return `JOBFAST-${prefix}:${id.replace(/-/g, '').slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

// Permit QR: JOBFAST-PERMIT:{permitId8}-{citizenId6}-{ts36}
function permitQR(permitId: string, citizenId: string): string {
  return `JOBFAST-PERMIT:${permitId.replace(/-/g, '').slice(0, 8)}-${citizenId.replace(/-/g, '').slice(0, 6)}-${Date.now().toString(36)}`;
}

// Default validity in days per permit type
const PERMIT_VALIDITY: Record<PermitType, number> = {
  building:     365, work:     180, business: 365,
  construction: 180, travel:    90, import:    90, export: 90,
};

export const PermitService = {
  async apply(citizenId: string, agencyId: string, type: PermitType, title: string, description?: string): Promise<GovernmentPermit> {
    const referenceNo = generateRef('PERMIT', `${citizenId}${Date.now()}`);
    const permit = await GovernmentRepository.createPermit({
      citizenId, agencyId, type, status: 'draft', title, referenceNo,
      ...(description && { description }),
    });
    TypedEventBus.publish({ eventName: 'gov.permit.applied', payload: { permitId: permit.id, citizenId, type } });
    return permit;
  },

  async submitDocument(permitId: string, citizenId: string, docName: string, docUrl: string): Promise<void> {
    const permit = await GovernmentRepository.getPermit(permitId);
    if (!permit || permit.citizenId !== citizenId) throw new Error('Pèmi pa jwenn');
    await GovernmentRepository.addPermitDocument(permitId, docName, docUrl);
  },

  async reviewPermit(permitId: string, reviewerId: string, decision: 'approved' | 'rejected', note?: string): Promise<void> {
    const permit = await GovernmentRepository.getPermit(permitId);
    if (!permit) throw new Error('Pèmi pa jwenn');

    if (decision === 'approved') {
      const validDays = PERMIT_VALIDITY[permit.type];
      const expiresAt = new Date(Date.now() + validDays * 86400000).toISOString();
      const qrCode    = permitQR(permit.id, permit.citizenId);
      await GovernmentRepository.updatePermitStatus(permitId, 'approved', { reviewedBy: reviewerId, reviewNote: note, qrCode, expiresAt });
      TypedEventBus.publish({ eventName: 'gov.permit.approved', payload: { permitId, citizenId: permit.citizenId, type: permit.type } });
    } else {
      await GovernmentRepository.updatePermitStatus(permitId, 'rejected', { reviewedBy: reviewerId, reviewNote: note });
      TypedEventBus.publish({ eventName: 'gov.permit.rejected', payload: { permitId, citizenId: permit.citizenId, reason: note } });
    }
  },

  async listCitizenPermits(citizenId: string): Promise<GovernmentPermit[]> {
    return GovernmentRepository.listCitizenPermits(citizenId);
  },

  async getPermit(id: string): Promise<GovernmentPermit | null> {
    return GovernmentRepository.getPermit(id);
  },
};