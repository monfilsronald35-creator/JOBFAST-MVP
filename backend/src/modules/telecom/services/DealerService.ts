import { TelecomRepository } from '../repositories/TelecomRepository.js';
import type { TelecomDealer, DealerTier } from '../types/telecom.types.js';

let _seq = 100;
function nextDealerCode(prefix = 'DLR'): string {
  return `${prefix}-${(++_seq).toString().padStart(6, '0')}`;
}

export const DealerService = {
  async register(operatorId: string, input: {
    userId: string; name: string; tier: DealerTier;
    country: string; city: string; phone: string;
    email?: string; managerId?: string; currency?: string;
  }): Promise<TelecomDealer> {
    const existing = await TelecomRepository.getDealerByUser(operatorId, input.userId);
    if (existing) throw new Error('DEALER_ALREADY_EXISTS');

    const op = await TelecomRepository.getOperator(operatorId);
    return TelecomRepository.createDealer({
      operatorId, userId: input.userId, name: input.name,
      code: nextDealerCode(), tier: input.tier,
      country: input.country, city: input.city, phone: input.phone,
      email: input.email, managerId: input.managerId,
      walletBalance: 0, currency: input.currency ?? (op?.currency ?? 'HTG'),
      status: 'active',
    });
  },

  async get(id: string): Promise<TelecomDealer | null> {
    return TelecomRepository.getDealer(id);
  },

  async getByUser(operatorId: string, userId: string): Promise<TelecomDealer | null> {
    return TelecomRepository.getDealerByUser(operatorId, userId);
  },

  async list(operatorId: string): Promise<TelecomDealer[]> {
    return TelecomRepository.listDealers(operatorId);
  },

  async topUp(dealerId: string, amount: number): Promise<void> {
    await TelecomRepository.updateDealerWallet(dealerId, amount);
  },

  async suspend(dealerId: string): Promise<void> {
    await import('../../../core/database/SupabaseClient.js').then(({ db }) =>
      db.client().from('tel_dealers').update({ status: 'suspended' }).eq('id', dealerId),
    );
  },

  async upgradeTier(dealerId: string, tier: DealerTier): Promise<void> {
    await import('../../../core/database/SupabaseClient.js').then(({ db }) =>
      db.client().from('tel_dealers').update({ tier }).eq('id', dealerId),
    );
  },

  async getPerformance(dealerId: string): Promise<{ rechargeCount: number; totalRevenue: number; commissionEarned: number }> {
    const [recharges, commissions] = await Promise.all([
      TelecomRepository.listRecharges({ dealerId, status: 'completed' }),
      TelecomRepository.listCommissions(dealerId, 'paid'),
    ]);
    return {
      rechargeCount:    recharges.length,
      totalRevenue:     recharges.reduce((s, r) => s + r.amount, 0),
      commissionEarned: commissions.reduce((s, c) => s + c.amount, 0),
    };
  },
};