export interface CashPosition {
  currency:     string;
  total:        number;   // integer minor units
  available:    number;
  reserved:     number;
  inFlight:     number;   // in-process payouts/transfers
  lastUpdated:  number;
}

export interface FloatRecord {
  id:          string;
  currency:    string;
  amount:      number;
  source:      string;   // e.g. 'stripe', 'moncash'
  settlesAt:   number;
  createdAt:   number;
}

export interface LiquidityAlert {
  currency:     string;
  level:        'ok' | 'low' | 'critical';
  available:    number;
  threshold:    number;
  message:      string;
  timestamp:    number;
}

export const TreasuryEngine = {
  async getCashPositions(): Promise<CashPosition[]> {
    try {
      const res = await fetch('/api/payments/treasury/positions');
      return res.ok ? res.json() as Promise<CashPosition[]> : [];
    } catch { return []; }
  },

  async getPosition(currency: string): Promise<CashPosition | null> {
    try {
      const res = await fetch(`/api/payments/treasury/positions/${currency}`);
      return res.ok ? res.json() as Promise<CashPosition> : null;
    } catch { return null; }
  },

  async getFloatRecords(currency?: string, limit = 50): Promise<FloatRecord[]> {
    const q = new URLSearchParams({ limit: String(limit) });
    if (currency) q.set('currency', currency);
    try {
      const res = await fetch(`/api/payments/treasury/float?${q}`);
      return res.ok ? res.json() as Promise<FloatRecord[]> : [];
    } catch { return []; }
  },

  async getLiquidityAlerts(): Promise<LiquidityAlert[]> {
    try {
      const res = await fetch('/api/payments/treasury/liquidity/alerts');
      return res.ok ? res.json() as Promise<LiquidityAlert[]> : [];
    } catch { return []; }
  },

  async reserveFunds(currency: string, amount: number, purpose: string): Promise<{ reservationId: string }> {
    const res = await fetch('/api/payments/treasury/reserve', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ currency, amount, purpose }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{ reservationId: string }>;
  },

  async releaseReservation(reservationId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/payments/treasury/reserve/${reservationId}`, { method: 'DELETE' });
      return res.ok;
    } catch { return false; }
  },

  // Total net position across all currencies in USD equivalent
  async getNetPosition(): Promise<{ totalUSD: number; breakdown: CashPosition[] }> {
    try {
      const res = await fetch('/api/payments/treasury/net-position');
      return res.ok ? res.json() as Promise<{ totalUSD: number; breakdown: CashPosition[] }> : { totalUSD: 0, breakdown: [] };
    } catch { return { totalUSD: 0, breakdown: [] }; }
  },
};
