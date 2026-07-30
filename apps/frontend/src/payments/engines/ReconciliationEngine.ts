export interface ReconciliationResult {
  id:              string;
  period:          { from: number; to: number };
  provider:        string;
  matched:         number;
  unmatched:       number;
  discrepancies:   DiscrepancyRecord[];
  status:          'in_progress' | 'completed' | 'requires_review';
  completedAt?:    number;
  createdAt:       number;
}

export interface DiscrepancyRecord {
  id:              string;
  type:            'amount_mismatch' | 'missing_in_provider' | 'missing_in_ledger' | 'duplicate' | 'status_mismatch';
  internalId?:     string;
  providerRef?:    string;
  internalAmount?: number;
  providerAmount?: number;
  currency:        string;
  severity:        'low' | 'medium' | 'high';
  resolved:        boolean;
  resolvedAt?:     number;
  notes?:          string;
}

export const ReconciliationEngine = {
  async runReconciliation(provider: string, from: number, to: number): Promise<ReconciliationResult> {
    const res = await fetch('/api/payments/reconciliation/run', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ provider, from, to }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<ReconciliationResult>;
  },

  async getLatestResult(provider: string): Promise<ReconciliationResult | null> {
    try {
      const res = await fetch(`/api/payments/reconciliation/latest?provider=${provider}`);
      return res.ok ? res.json() as Promise<ReconciliationResult> : null;
    } catch { return null; }
  },

  async getHistory(provider?: string, limit = 20): Promise<ReconciliationResult[]> {
    const q = new URLSearchParams({ limit: String(limit) });
    if (provider) q.set('provider', provider);
    try {
      const res = await fetch(`/api/payments/reconciliation/history?${q}`);
      return res.ok ? res.json() as Promise<ReconciliationResult[]> : [];
    } catch { return []; }
  },

  async getDiscrepancies(resultId: string): Promise<DiscrepancyRecord[]> {
    try {
      const res = await fetch(`/api/payments/reconciliation/${resultId}/discrepancies`);
      return res.ok ? res.json() as Promise<DiscrepancyRecord[]> : [];
    } catch { return []; }
  },

  async resolveDiscrepancy(discrepancyId: string, notes: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/payments/reconciliation/discrepancies/${discrepancyId}/resolve`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notes }),
      });
      return res.ok;
    } catch { return false; }
  },

  async autoReconcile(provider: string): Promise<{ resolved: number; remaining: number }> {
    const res = await fetch('/api/payments/reconciliation/auto-resolve', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ provider }),
    });
    if (!res.ok) return { resolved: 0, remaining: 0 };
    return res.json() as Promise<{ resolved: number; remaining: number }>;
  },
};
