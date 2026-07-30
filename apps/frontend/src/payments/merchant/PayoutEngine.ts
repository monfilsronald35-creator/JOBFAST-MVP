export type PayoutStatus = 'pending' | 'in_transit' | 'paid' | 'failed' | 'cancelled';

export interface Payout {
  id:            string;
  merchantId?:   string;
  recipientId:   string;
  amount:        number;     // integer minor units
  currency:      string;
  method:        string;     // 'bank_transfer' | 'wallet' | 'mobile_money'
  status:        PayoutStatus;
  reference?:    string;
  scheduledAt?:  number;
  paidAt?:       number;
  failureReason?: string;
  metadata?:     Record<string, unknown>;
  createdAt:     number;
}

export interface PayoutSplit {
  recipientId: string;
  amount:      number;   // integer minor units
  currency:    string;
  label?:      string;
}

export interface PayrollEntry {
  employeeId:  string;
  amount:      number;
  currency:    string;
  description?: string;
  period:      { from: number; to: number };
}

export const PayoutEngine = {
  async create(params: Omit<Payout, 'id' | 'status' | 'createdAt'>): Promise<Payout> {
    const res = await fetch('/api/payments/payouts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(params),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<Payout>;
  },

  async get(payoutId: string): Promise<Payout | null> {
    try {
      const res = await fetch(`/api/payments/payouts/${payoutId}`);
      return res.ok ? res.json() as Promise<Payout> : null;
    } catch { return null; }
  },

  async list(filters: { merchantId?: string; recipientId?: string; status?: PayoutStatus; limit?: number }): Promise<Payout[]> {
    const q = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
    try {
      const res = await fetch(`/api/payments/payouts?${q}`);
      return res.ok ? res.json() as Promise<Payout[]> : [];
    } catch { return []; }
  },

  async cancel(payoutId: string, reason?: string): Promise<boolean> {
    const res = await fetch(`/api/payments/payouts/${payoutId}/cancel`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ reason }),
    });
    return res.ok;
  },

  // Split a total amount across multiple recipients (marketplace payout)
  async splitPayout(splits: PayoutSplit[], reference?: string): Promise<Payout[]> {
    const res = await fetch('/api/payments/payouts/split', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ splits, reference }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<Payout[]>;
  },

  // Schedule a future payout
  async schedule(params: Omit<Payout, 'id' | 'status' | 'createdAt'>, scheduledAt: number): Promise<Payout> {
    return this.create({ ...params, scheduledAt });
  },

  // Payroll — send salaries to multiple employees in one batch
  async runPayroll(entries: PayrollEntry[], merchantId: string): Promise<{ payouts: Payout[]; totalAmount: number }> {
    const res = await fetch('/api/payments/payouts/payroll', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ entries, merchantId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{ payouts: Payout[]; totalAmount: number }>;
  },

  // Validate splits total equals expected amount (no leakage)
  validateSplits(splits: PayoutSplit[], expectedTotal: number): { valid: boolean; diff: number } {
    const total = splits.reduce((s, sp) => s + sp.amount, 0);
    return { valid: total === expectedTotal, diff: total - expectedTotal };
  },
};
