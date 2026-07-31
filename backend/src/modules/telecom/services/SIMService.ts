import { TelecomRepository } from '../repositories/TelecomRepository.js';
import type { SIMCard }      from '../types/telecom.types.js';

export const SIMService = {
  async register(operatorId: string, userId: string, input: {
    iccid: string; msisdn: string; type: SIMCard['type']; country: string;
  }): Promise<SIMCard> {
    const existing = await TelecomRepository.getSIM(input.iccid);
    if (existing) throw new Error('SIM_ALREADY_REGISTERED');

    return TelecomRepository.createSIM({
      operatorId, userId, iccid: input.iccid, msisdn: input.msisdn,
      type: input.type, status: 'registered', kycStatus: 'pending', country: input.country,
    });
  },

  async verifyKYC(simId: string, approved: boolean): Promise<void> {
    const kycStatus: SIMCard['kycStatus'] = approved ? 'verified' : 'rejected';
    const status: SIMCard['status']       = approved ? 'active'   : 'suspended';
    await TelecomRepository.updateSIMStatus(simId, status, kycStatus);
  },

  async activate(simId: string): Promise<void> {
    await TelecomRepository.updateSIMStatus(simId, 'active');
  },

  async suspend(simId: string): Promise<void> {
    await TelecomRepository.updateSIMStatus(simId, 'suspended');
  },

  async terminate(simId: string): Promise<void> {
    await TelecomRepository.updateSIMStatus(simId, 'terminated');
  },

  async replace(oldIccid: string, newIccid: string, userId: string, operatorId: string): Promise<SIMCard> {
    const old = await TelecomRepository.getSIM(oldIccid);
    if (!old || old.userId !== userId) throw new Error('SIM_NOT_FOUND');

    await TelecomRepository.updateSIMStatus(old.id, 'terminated');
    return TelecomRepository.createSIM({
      operatorId, userId, iccid: newIccid, msisdn: old.msisdn,
      type: old.type, status: 'registered', kycStatus: 'pending', country: old.country,
    });
  },

  async listMine(userId: string): Promise<SIMCard[]> {
    return TelecomRepository.listSIMs(userId);
  },

  async getBySIM(iccid: string): Promise<SIMCard | null> {
    return TelecomRepository.getSIM(iccid);
  },
};