export type CardStatus = 'active' | 'frozen' | 'cancelled' | 'pending';

export interface VirtualCard {
  id:         string;
  userId:     string;
  last4:      string;    // last 4 digits only — never full PAN (PCI DSS)
  brand:      string;
  expiryMonth: number;
  expiryYear:  number;
  currency:    string;
  spendingLimit?: number;   // monthly limit in minor units
  status:     CardStatus;
  createdAt:  number;
}

export interface PhysicalCardRequest {
  userId:      string;
  name:        string;
  address:     { line1: string; city: string; country: string; postalCode: string };
  currency:    string;
}

export interface CardControls {
  frozen:           boolean;
  monthlyLimit?:    number;   // minor units
  dailyLimit?:      number;
  allowedMerchantCategories?: string[];  // MCC codes
  blockedMerchantCategories?: string[];
  allowOnline:      boolean;
  allowContactless: boolean;
  allowAtm:         boolean;
}

export const CardEngine = {
  async issueVirtualCard(userId: string, currency: string, spendingLimit?: number): Promise<VirtualCard> {
    const res = await fetch('/api/payments/cards/virtual', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, currency, spendingLimit }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<VirtualCard>;
  },

  async requestPhysicalCard(request: PhysicalCardRequest): Promise<{ requestId: string; estimatedDelivery: number }> {
    const res = await fetch('/api/payments/cards/physical/request', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(request),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{ requestId: string; estimatedDelivery: number }>;
  },

  async getUserCards(userId: string): Promise<VirtualCard[]> {
    try {
      const res = await fetch(`/api/payments/cards?userId=${userId}`);
      return res.ok ? res.json() as Promise<VirtualCard[]> : [];
    } catch { return []; }
  },

  async freeze(cardId: string): Promise<boolean> {
    const res = await fetch(`/api/payments/cards/${cardId}/freeze`, { method: 'POST' });
    return res.ok;
  },

  async unfreeze(cardId: string): Promise<boolean> {
    const res = await fetch(`/api/payments/cards/${cardId}/unfreeze`, { method: 'POST' });
    return res.ok;
  },

  async cancel(cardId: string, reason?: string): Promise<boolean> {
    const res = await fetch(`/api/payments/cards/${cardId}/cancel`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ reason }),
    });
    return res.ok;
  },

  async updateControls(cardId: string, controls: Partial<CardControls>): Promise<CardControls> {
    const res = await fetch(`/api/payments/cards/${cardId}/controls`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(controls),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<CardControls>;
  },

  async getControls(cardId: string): Promise<CardControls | null> {
    try {
      const res = await fetch(`/api/payments/cards/${cardId}/controls`);
      return res.ok ? res.json() as Promise<CardControls> : null;
    } catch { return null; }
  },

  // Generate QR code payload for QR-based card payments
  async getQRPayload(cardId: string, amount?: number, currency?: string): Promise<{ qr: string; expiresAt: number }> {
    const res = await fetch('/api/payments/cards/qr', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ cardId, amount, currency }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{ qr: string; expiresAt: number }>;
  },
};
