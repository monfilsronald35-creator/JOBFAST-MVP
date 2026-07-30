export interface ClearingBatch {
  id:           string;
  period:       { from: number; to: number };
  currency:     string;
  totalDebits:  number;   // integer minor units
  totalCredits: number;
  netPosition:  number;   // debits − credits
  txCount:      number;
  status:       'open' | 'clearing' | 'cleared' | 'failed';
  clearedAt?:   number;
  createdAt:    number;
}

export interface NettingResult {
  grossDebits:  number;
  grossCredits: number;
  netAmount:    number;
  savingsVsGross: number;
  currency:     string;
}

export const ClearingEngine = {
  async getCurrentBatch(currency: string): Promise<ClearingBatch | null> {
    try {
      const res = await fetch(`/api/payments/clearing/current?currency=${currency}`);
      return res.ok ? res.json() as Promise<ClearingBatch> : null;
    } catch { return null; }
  },

  async getBatchHistory(currency: string, limit = 30): Promise<ClearingBatch[]> {
    try {
      const res = await fetch(`/api/payments/clearing/batches?currency=${currency}&limit=${limit}`);
      return res.ok ? res.json() as Promise<ClearingBatch[]> : [];
    } catch { return []; }
  },

  async triggerClearing(batchId: string): Promise<ClearingBatch> {
    const res = await fetch(`/api/payments/clearing/${batchId}/clear`, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<ClearingBatch>;
  },

  calculateNetting(debits: number[], credits: number[], currency: string): NettingResult {
    const grossDebits  = debits.reduce((a, b) => a + b, 0);
    const grossCredits = credits.reduce((a, b) => a + b, 0);
    const netAmount    = Math.abs(grossDebits - grossCredits);
    const gross        = grossDebits + grossCredits;
    return {
      grossDebits, grossCredits, netAmount, currency,
      savingsVsGross: gross > 0 ? Math.round((1 - netAmount / gross) * 100) : 0,
    };
  },

  async getClearingStatus(batchId: string): Promise<ClearingBatch['status'] | null> {
    try {
      const res = await fetch(`/api/payments/clearing/${batchId}/status`);
      if (!res.ok) return null;
      const data = await res.json() as { status: ClearingBatch['status'] };
      return data.status;
    } catch { return null; }
  },
};
