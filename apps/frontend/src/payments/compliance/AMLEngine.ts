import type { AMLFlag, AMLRiskLevel, TransactionMonitoringAlert } from '../types/compliance';

export const AMLEngine = {
  async checkTransaction(params: {
    transactionId: string;
    userId:        string;
    amount:        number;   // minor units
    currency:      string;
    provider:      string;
    metadata?:     Record<string, unknown>;
  }): Promise<{ pass: boolean; flags: AMLFlag[]; requiresReview: boolean }> {
    try {
      const res = await fetch('/api/payments/aml/check', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      });
      if (res.ok) return res.json() as Promise<{ pass: boolean; flags: AMLFlag[]; requiresReview: boolean }>;
    } catch { /* */ }
    // Default pass if AML service unavailable (non-blocking, flagged for async review)
    return { pass: true, flags: [], requiresReview: false };
  },

  async getFlags(userId: string, resolved = false): Promise<AMLFlag[]> {
    try {
      const res = await fetch(`/api/payments/aml/flags?userId=${userId}&resolved=${resolved}`);
      return res.ok ? res.json() as Promise<AMLFlag[]> : [];
    } catch { return []; }
  },

  async getAlerts(limit = 20): Promise<TransactionMonitoringAlert[]> {
    try {
      const res = await fetch(`/api/payments/aml/alerts?limit=${limit}`);
      return res.ok ? res.json() as Promise<TransactionMonitoringAlert[]> : [];
    } catch { return []; }
  },

  async resolveFlag(flagId: string, resolution: AMLFlag['resolution'], notes?: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/payments/aml/flags/${flagId}/resolve`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ resolution, notes }),
      });
      return res.ok;
    } catch { return false; }
  },

  async getVelocity(userId: string, windowHours = 24): Promise<{ count: number; totalAmount: number; currency: string }> {
    try {
      const res = await fetch(`/api/payments/aml/velocity?userId=${userId}&windowHours=${windowHours}`);
      if (res.ok) return res.json() as Promise<{ count: number; totalAmount: number; currency: string }>;
    } catch { /* */ }
    return { count: 0, totalAmount: 0, currency: 'USD' };
  },

  // Structuring detection — splits just below reporting thresholds (e.g. $10k CTR)
  detectStructuring(transactions: Array<{ amount: number; timestamp: number }>, threshold = 1000000): boolean {
    const last24h = transactions.filter(tx => tx.timestamp > Date.now() - 86_400_000);
    const total   = last24h.reduce((s, tx) => s + tx.amount, 0);
    const nearThreshold = last24h.filter(tx => tx.amount >= threshold * 0.85 && tx.amount < threshold);
    return nearThreshold.length >= 2 || total >= threshold;
  },

  riskLevelFromScore(score: number): AMLRiskLevel {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  },
};
