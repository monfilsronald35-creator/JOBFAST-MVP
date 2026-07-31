import { TelecomRepository }  from '../repositories/TelecomRepository.js';
import type { TelecomDealer, CommissionType } from '../types/telecom.types.js';

export const CommissionEngine = {
  async compute(operatorId: string, dealer: TelecomDealer, rechargeId: string, baseAmount: number, type: CommissionType): Promise<void> {
    const rules = await TelecomRepository.getCommissionRules(operatorId);
    const rule  = rules.find(r => r.type === type && r.dealerTier === dealer.tier && baseAmount >= r.minAmount);

    if (!rule) return;

    const amount = Math.round(baseAmount * rule.ratePercent / 100) + (rule.bonusAmount ?? 0);
    if (amount <= 0) return;

    await TelecomRepository.createCommission({
      operatorId, dealerId: dealer.id, type, rechargeId,
      baseAmount, rate: rule.ratePercent, amount,
      currency: dealer.currency, status: 'approved',
    });

    await TelecomRepository.updateDealerWallet(dealer.id, amount);
  },

  async computeMonthlyBonus(operatorId: string, dealerId: string): Promise<void> {
    const dealer = await TelecomRepository.getDealer(dealerId);
    if (!dealer) return;

    const month     = new Date().toISOString().slice(0, 7);
    const recharges = await TelecomRepository.listRecharges({ dealerId, status: 'completed', limit: 1000 });
    const monthRecharges = recharges.filter(r => r.createdAt.startsWith(month));
    const totalVolume    = monthRecharges.reduce((s, r) => s + r.amount, 0);

    const rules = await TelecomRepository.getCommissionRules(operatorId);
    const rule  = rules.find(r => r.type === 'monthly_bonus' && r.dealerTier === dealer.tier && totalVolume >= r.minAmount);
    if (!rule || !rule.bonusAmount) return;

    await TelecomRepository.createCommission({
      operatorId, dealerId, type: 'monthly_bonus',
      baseAmount: totalVolume, rate: 0, amount: rule.bonusAmount,
      currency: dealer.currency, status: 'approved',
    });

    await TelecomRepository.updateDealerWallet(dealerId, rule.bonusAmount);
  },

  async list(dealerId: string, status?: string) {
    return TelecomRepository.listCommissions(dealerId, status);
  },

  async payout(operatorId: string, dealerId: string): Promise<number> {
    const pending = await TelecomRepository.listCommissions(dealerId, 'approved');
    const total   = pending.reduce((s, c) => s + c.amount, 0);

    for (const c of pending) {
      await import('../../../core/database/SupabaseClient.js').then(({ db }) =>
        db.client().from('tel_commissions')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', c.id),
      );
    }
    return total;
  },
};