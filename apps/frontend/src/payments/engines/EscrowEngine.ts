export type EscrowStatus = 'holding' | 'released' | 'refunded' | 'disputed' | 'expired';

export interface EscrowAccount {
  id:            string;
  payerId:       string;
  payeeId:       string;
  amount:        number;     // integer minor units
  currency:      string;
  status:        EscrowStatus;
  releaseCondition: string;  // human-readable description
  autoReleaseAt?: number;    // Unix ms UTC — auto-releases if not disputed
  releasedAt?:   number;
  refundedAt?:   number;
  disputedAt?:   number;
  metadata?:     Record<string, unknown>;
  createdAt:     number;
}

export interface EscrowRelease {
  escrowId:      string;
  amount?:       number;     // partial release if specified
  reason?:       string;
  releasedBy:    string;
}

export interface EscrowDispute {
  escrowId:  string;
  reason:    string;
  evidence?: string;
  raisedBy:  string;
}

export const EscrowEngine = {
  async create(params: {
    payerId:  string;
    payeeId:  string;
    amount:   number;
    currency: string;
    releaseCondition: string;
    autoReleaseAt?:   number;
    metadata?: Record<string, unknown>;
  }): Promise<EscrowAccount> {
    const res = await fetch('/api/payments/escrow', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(params),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<EscrowAccount>;
  },

  async get(escrowId: string): Promise<EscrowAccount | null> {
    try {
      const res = await fetch(`/api/payments/escrow/${escrowId}`);
      return res.ok ? res.json() as Promise<EscrowAccount> : null;
    } catch { return null; }
  },

  async getUserEscrows(userId: string, role: 'payer' | 'payee' = 'payer'): Promise<EscrowAccount[]> {
    try {
      const res = await fetch(`/api/payments/escrow?userId=${userId}&role=${role}`);
      return res.ok ? res.json() as Promise<EscrowAccount[]> : [];
    } catch { return []; }
  },

  async release(params: EscrowRelease): Promise<EscrowAccount> {
    const res = await fetch(`/api/payments/escrow/${params.escrowId}/release`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(params),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<EscrowAccount>;
  },

  async refund(escrowId: string, reason?: string): Promise<EscrowAccount> {
    const res = await fetch(`/api/payments/escrow/${escrowId}/refund`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<EscrowAccount>;
  },

  async dispute(params: EscrowDispute): Promise<EscrowAccount> {
    const res = await fetch(`/api/payments/escrow/${params.escrowId}/dispute`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(params),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<EscrowAccount>;
  },

  async releasePartial(escrowId: string, amount: number, releasedBy: string): Promise<EscrowAccount> {
    return this.release({ escrowId, amount, releasedBy });
  },

  isReleaseble(escrow: EscrowAccount): boolean {
    return escrow.status === 'holding';
  },

  isDisputable(escrow: EscrowAccount): boolean {
    return escrow.status === 'holding';
  },
};
