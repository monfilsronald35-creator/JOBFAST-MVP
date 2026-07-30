export interface MerchantProfile {
  id:              string;
  userId:          string;
  businessName:    string;
  category:        string;   // MCC
  website?:        string;
  settlementConfig: SettlementConfig;
  feeRate:         number;   // override percent (0 = platform default)
  status:          'pending' | 'active' | 'suspended' | 'closed';
  createdAt:       number;
}

export interface SettlementConfig {
  currency:           string;
  bankAccount?:       { bankName: string; last4: string; accountType: string };
  walletId?:          string;
  settlementWindow:   'T+0' | 'T+1' | 'T+2';
  minimumPayout:      number;   // minor units
  automaticPayout:    boolean;
  payoutSchedule?:    'daily' | 'weekly' | 'monthly';
}

export interface MerchantAnalytics {
  merchantId:     string;
  period:         { from: number; to: number };
  totalRevenue:   number;   // minor units
  totalFees:      number;
  totalNet:       number;
  txCount:        number;
  currency:       string;
  avgOrderValue:  number;
  refundRate:     number;   // 0–100 percent
  chargebackRate: number;
}

export interface TeamPermission {
  userId:      string;
  role:        'admin' | 'manager' | 'viewer' | 'support';
  permissions: string[];
  addedAt:     number;
}

export const MerchantEngine = {
  async getProfile(merchantId: string): Promise<MerchantProfile | null> {
    try {
      const res = await fetch(`/api/payments/merchants/${merchantId}`);
      return res.ok ? res.json() as Promise<MerchantProfile> : null;
    } catch { return null; }
  },

  async create(params: Pick<MerchantProfile, 'userId' | 'businessName' | 'category' | 'website'>): Promise<MerchantProfile> {
    const res = await fetch('/api/payments/merchants', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(params),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<MerchantProfile>;
  },

  async updateSettlement(merchantId: string, config: Partial<SettlementConfig>): Promise<MerchantProfile> {
    const res = await fetch(`/api/payments/merchants/${merchantId}/settlement`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(config),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<MerchantProfile>;
  },

  async getAnalytics(merchantId: string, from: number, to: number, currency?: string): Promise<MerchantAnalytics> {
    const q = new URLSearchParams({ from: String(from), to: String(to) });
    if (currency) q.set('currency', currency);
    const res = await fetch(`/api/payments/merchants/${merchantId}/analytics?${q}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<MerchantAnalytics>;
  },

  async getTaxReport(merchantId: string, year: number): Promise<Blob> {
    const res = await fetch(`/api/payments/merchants/${merchantId}/tax-report?year=${year}`, {
      headers: { 'Accept': 'application/pdf' },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.blob();
  },

  async getTeam(merchantId: string): Promise<TeamPermission[]> {
    try {
      const res = await fetch(`/api/payments/merchants/${merchantId}/team`);
      return res.ok ? res.json() as Promise<TeamPermission[]> : [];
    } catch { return []; }
  },

  async addTeamMember(merchantId: string, userId: string, role: TeamPermission['role']): Promise<TeamPermission> {
    const res = await fetch(`/api/payments/merchants/${merchantId}/team`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, role }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<TeamPermission>;
  },

  async removeTeamMember(merchantId: string, userId: string): Promise<boolean> {
    const res = await fetch(`/api/payments/merchants/${merchantId}/team/${userId}`, { method: 'DELETE' });
    return res.ok;
  },
};
