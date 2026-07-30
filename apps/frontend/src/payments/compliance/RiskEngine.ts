import type { RiskAssessment, AMLRiskLevel } from '../types/compliance';
import type { PaymentRequest } from '../types/core';

export interface RiskSignal {
  name:    string;
  score:   number;   // 0–100 contribution
  details: string;
}

export const RiskEngine = {
  async assessTransaction(request: PaymentRequest, context?: {
    userId?: string; userAge?: number; deviceId?: string; ipCountry?: string; sessionId?: string;
  }): Promise<RiskAssessment> {
    try {
      const res = await fetch('/api/payments/risk/assess', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...request, context }),
      });
      if (res.ok) return res.json() as Promise<RiskAssessment>;
    } catch { /* client-side fallback */ }

    // Lightweight client-side heuristics
    const signals = this.runHeuristics(request, context);
    const score   = Math.min(100, signals.reduce((s, sig) => s + sig.score, 0));
    const level   = this.levelFromScore(score);

    return {
      userId:          context?.userId,
      score,
      level,
      signals:         signals.map(s => s.name),
      recommendation:  score >= 70 ? 'block' : score >= 40 ? 'review' : 'allow',
      timestamp:       Date.now(),
    };
  },

  async getUserRisk(userId: string): Promise<RiskAssessment | null> {
    try {
      const res = await fetch(`/api/payments/risk/users/${userId}`);
      return res.ok ? res.json() as Promise<RiskAssessment> : null;
    } catch { return null; }
  },

  async updateUserRisk(userId: string, event: 'fraud_confirmed' | 'fraud_cleared' | 'chargeback' | 'manual_review_cleared'): Promise<void> {
    await fetch('/api/payments/risk/users/update', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, event }),
    }).catch(() => { /* non-blocking */ });
  },

  // Local heuristics that don't require a server call
  runHeuristics(request: PaymentRequest, context?: { userAge?: number; ipCountry?: string; deviceId?: string }): RiskSignal[] {
    const signals: RiskSignal[] = [];

    if (request.amount > 5_000_000) {
      signals.push({ name: 'high_amount', score: 20, details: `Amount ${request.amount} exceeds threshold` });
    }
    if (context?.userAge !== undefined && context.userAge < 7) {
      signals.push({ name: 'new_account', score: 15, details: 'Account less than 7 days old' });
    }
    if (!request.paymentToken && !request.savedMethodId) {
      signals.push({ name: 'no_payment_token', score: 10, details: 'No tokenized payment method' });
    }
    if (request.metadata?.['vpn'] === true) {
      signals.push({ name: 'vpn_detected', score: 20, details: 'VPN/proxy usage detected' });
    }
    if (context?.ipCountry && context.ipCountry !== (request.metadata?.['userCountry'] as string | undefined)) {
      signals.push({ name: 'country_mismatch', score: 15, details: 'IP country differs from user country' });
    }

    return signals;
  },

  levelFromScore(score: number): AMLRiskLevel {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  },

  shouldBlock(assessment: RiskAssessment): boolean {
    return assessment.recommendation === 'block';
  },

  shouldReview(assessment: RiskAssessment): boolean {
    return assessment.recommendation === 'review';
  },
};
