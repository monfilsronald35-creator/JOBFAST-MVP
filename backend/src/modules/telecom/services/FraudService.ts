import { TelecomRepository } from '../repositories/TelecomRepository.js';
import type { FraudType }    from '../types/telecom.types.js';

interface FraudCheckResult { riskScore: number; blocked: boolean; reasons: string[] }

export const FraudService = {
  async checkRecharge(operatorId: string, userId: string, phone: string, amount: number): Promise<FraudCheckResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Rule 1: Duplicate phone in last 5 minutes (> 3 recharges)
    const recentCount = await TelecomRepository.countRecentRecharges(phone, 5);
    if (recentCount >= 3) {
      riskScore += 40; reasons.push('HIGH_FREQUENCY');
    }

    // Rule 2: Very high single recharge amount (> 1,000,000 minor units = $10,000)
    if (amount > 1_000_000_00) {
      riskScore += 30; reasons.push('HIGH_AMOUNT');
    }

    // Rule 3: Round-number pattern abuse (exactly divisible by 10000)
    if (amount % 10000 === 0 && amount > 100000) {
      riskScore += 10; reasons.push('ROUND_AMOUNT_PATTERN');
    }

    const blocked = riskScore >= 60;

    if (riskScore >= 30) {
      await TelecomRepository.createFraudEvent({
        operatorId, userId, type: 'fake_recharge',
        riskScore, details: { phone, amount, reasons },
        action: blocked ? 'blocked' : 'flagged',
      });
    }

    return { riskScore, blocked, reasons };
  },

  async checkDealer(operatorId: string, dealerId: string, salesCount: number, refundRate: number): Promise<FraudCheckResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    if (refundRate > 0.2) { riskScore += 35; reasons.push('HIGH_REFUND_RATE'); }
    if (salesCount > 500) { riskScore += 15; reasons.push('UNUSUAL_VOLUME'); }

    const blocked = riskScore >= 60;
    if (riskScore >= 25) {
      await TelecomRepository.createFraudEvent({
        operatorId, dealerId, type: 'dealer_fraud',
        riskScore, details: { salesCount, refundRate, reasons },
        action: blocked ? 'blocked' : 'flagged',
      });
    }

    return { riskScore, blocked, reasons };
  },

  async listEvents(operatorId: string, limit = 50) {
    return TelecomRepository.listFraudEvents(operatorId, limit);
  },

  async logEvent(operatorId: string, type: FraudType, userId: string | undefined, details: Record<string, unknown>): Promise<void> {
    await TelecomRepository.createFraudEvent({
      operatorId, type, riskScore: 50, details,
      action: 'flagged', userId,
    });
  },
};