import type { Transaction } from '../types';

export type SettlementWindow = 'T+0' | 'T+1' | 'T+2' | 'T+5';

export interface SettlementBatch {
  id:             string;
  merchantId:     string;
  currency:       string;
  grossAmount:    number;   // integer minor units
  fees:           number;
  netAmount:      number;
  txCount:        number;
  window:         SettlementWindow;
  status:         'pending' | 'processing' | 'settled' | 'failed';
  settledAt?:     number;
  createdAt:      number;
}

export interface SettlementReport {
  merchantId:  string;
  period:      { from: number; to: number };
  batches:     SettlementBatch[];
  totalGross:  number;
  totalFees:   number;
  totalNet:    number;
  currency:    string;
}

export const SettlementEngine = {
  async getPendingBatches(merchantId: string): Promise<SettlementBatch[]> {
    try {
      const res = await fetch(`/api/payments/settlements?merchantId=${merchantId}&status=pending`);
      if (res.ok) return res.json() as Promise<SettlementBatch[]>;
    } catch { /* */ }
    return [];
  },

  async getBatch(batchId: string): Promise<SettlementBatch | null> {
    try {
      const res = await fetch(`/api/payments/settlements/${batchId}`);
      return res.ok ? res.json() as Promise<SettlementBatch> : null;
    } catch { return null; }
  },

  async createBatch(merchantId: string, txIds: string[], window: SettlementWindow = 'T+1'): Promise<SettlementBatch> {
    const res = await fetch('/api/payments/settlements', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ merchantId, txIds, window }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<SettlementBatch>;
  },

  async getReport(merchantId: string, from: number, to: number, currency?: string): Promise<SettlementReport> {
    const q = new URLSearchParams({ merchantId, from: String(from), to: String(to) });
    if (currency) q.set('currency', currency);
    const res = await fetch(`/api/payments/settlements/report?${q}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<SettlementReport>;
  },

  // Calculate net for a list of transactions
  calculateNet(transactions: Transaction[]): { gross: number; fees: number; net: number } {
    return transactions.reduce(
      (acc, tx) => ({ gross: acc.gross + tx.amount, fees: acc.fees + tx.fees, net: acc.net + tx.netAmount }),
      { gross: 0, fees: 0, net: 0 },
    );
  },

  async retryFailed(batchId: string): Promise<SettlementBatch> {
    const res = await fetch(`/api/payments/settlements/${batchId}/retry`, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<SettlementBatch>;
  },
};
