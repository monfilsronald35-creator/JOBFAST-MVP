import { FinancialRepository } from '../repositories/FinancialRepository.js';
import { RiskLevel, type RiskScore } from '../types/financial.types.js';

interface RiskInput {
  walletId:           string;
  amount:             number;
  currency:           string;
  ip?:        string | undefined;
  country?:   string | undefined;
  deviceId?:  string | undefined;
  txType?:    string | undefined;
}

const HIGH_RISK_COUNTRIES = new Set(['XX', 'YY']); // placeholder — configure per compliance

export const RiskEngine = {
  async score(input: RiskInput): Promise<Pick<RiskScore, 'score' | 'level' | 'factors' | 'decision'>> {
    const factors: Record<string, number> = {};
    let score = 0;

    // Amount factor
    if (input.amount > 50_000_000)       { factors['high_amount'] = 30; score += 30; }
    else if (input.amount > 10_000_000)  { factors['medium_amount'] = 15; score += 15; }

    // Country risk
    if (input.country && HIGH_RISK_COUNTRIES.has(input.country)) {
      factors['high_risk_country'] = 20; score += 20;
    }

    // International (non-HTG or foreign country)
    if (input.currency !== 'HTG') { factors['foreign_currency'] = 10; score += 10; }

    // No IP (anonymous)
    if (!input.ip) { factors['no_ip'] = 5; score += 5; }

    // Determine level and decision
    let level:    RiskLevel;
    let decision: RiskScore['decision'];

    if      (score >= 70) { level = RiskLevel.Critical; decision = 'block';  }
    else if (score >= 50) { level = RiskLevel.High;     decision = 'review'; }
    else if (score >= 30) { level = RiskLevel.Medium;   decision = 'review'; }
    else                  { level = RiskLevel.Low;      decision = 'allow';  }

    return { score: Math.min(100, score), level, factors, decision };
  },

  async scoreAndSave(transactionId: string, walletId: string, input: RiskInput): Promise<RiskScore> {
    const result = await RiskEngine.score(input);
    return FinancialRepository.saveRiskScore({
      transactionId, walletId,
      score: result.score, level: result.level,
      factors: result.factors, decision: result.decision,
    });
  },

  async flagFraud(walletId: string, ownerId: string, type: string, description: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const severity = metadata['amount'] && Number(metadata['amount']) > 10_000_000
      ? RiskLevel.High : RiskLevel.Medium;
    await FinancialRepository.createFraudFlag({
      walletId, ownerId, type, severity, description, metadata,
    });
  },

  detectSuspiciousPattern(transactions: Array<{ amount: number; createdAt: string }>): boolean {
    if (transactions.length < 3) return false;
    const last5min = transactions.filter(t => {
      const age = Date.now() - new Date(t.createdAt).getTime();
      return age < 5 * 60 * 1000;
    });
    if (last5min.length >= 5) return true;
    const totalLast5min = last5min.reduce((s, t) => s + t.amount, 0);
    if (totalLast5min > 50_000_000) return true;
    return false;
  },
};
