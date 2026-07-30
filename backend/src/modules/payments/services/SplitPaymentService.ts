import { PaymentRepository }        from '../repositories/PaymentRepository.js';
import { AppError }                  from '../../../core/errors/AppError.js';
import { PaymentStatus }             from '../types/payment.types.js';
import type { SplitRule, SplitEntry } from '../types/payment.types.js';

export const SplitPaymentService = {
  async compute(splitRuleId: string, intentId: string, amount: number, currency: string): Promise<SplitEntry[]> {
    const rule = await PaymentRepository.getSplitRule(splitRuleId);
    if (!rule) throw new AppError('Split rule not found', 404, 'NOT_FOUND');
    return SplitPaymentService.computeFromRule(rule, intentId, amount, currency);
  },

  computeFromRule(rule: SplitRule, intentId: string, amount: number, currency: string): SplitEntry[] {
    let remaining = amount;
    const entries: Omit<SplitEntry, 'id' | 'createdAt'>[] = [];
    for (const entry of rule.entries) {
      const share = entry.fixedAmount ?? Math.floor(amount * entry.percentage / 10000);
      remaining  -= share;
      entries.push({ intentId, recipient: entry.recipient, amount: share, currency, status: PaymentStatus.Pending });
    }
    // Any rounding remainder goes to first recipient
    if (remaining !== 0 && entries[0]) {
      (entries[0] as { amount: number }).amount += remaining;
    }
    return entries as SplitEntry[];
  },

  async execute(splitRuleId: string, intentId: string, amount: number, currency: string): Promise<void> {
    const rule = await PaymentRepository.getSplitRule(splitRuleId);
    if (!rule) throw new AppError('Split rule not found', 404, 'NOT_FOUND');
    const entries = SplitPaymentService.computeFromRule(rule, intentId, amount, currency);
    await PaymentRepository.createSplitEntries(entries);
  },

  async getForContext(context: string, intentId: string, amount: number, currency: string): Promise<void> {
    const rule = await PaymentRepository.getSplitRuleByContext(context);
    if (!rule) return;
    const entries = SplitPaymentService.computeFromRule(rule, intentId, amount, currency);
    await PaymentRepository.createSplitEntries(entries);
  },
};
