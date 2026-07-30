import type { KYCProfile, KYCDocument, KYCDocumentType, KYBProfile } from '../types/compliance';

export const KYCEngine = {
  // ─── Individual KYC ──────────────────────────────────────────────────────

  async getProfile(userId: string): Promise<KYCProfile | null> {
    try {
      const res = await fetch(`/api/payments/kyc/profiles/${userId}`);
      return res.ok ? res.json() as Promise<KYCProfile> : null;
    } catch { return null; }
  },

  async submitDocument(userId: string, type: KYCDocumentType, file: File): Promise<KYCDocument> {
    const form = new FormData();
    form.append('userId', userId);
    form.append('type',   type);
    form.append('file',   file);

    const res = await fetch('/api/payments/kyc/documents', { method: 'POST', body: form });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<KYCDocument>;
  },

  async getDocuments(userId: string): Promise<KYCDocument[]> {
    try {
      const res = await fetch(`/api/payments/kyc/documents?userId=${userId}`);
      return res.ok ? res.json() as Promise<KYCDocument[]> : [];
    } catch { return []; }
  },

  async requestReview(userId: string): Promise<{ status: string; estimatedDays: number }> {
    const res = await fetch('/api/payments/kyc/review', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{ status: string; estimatedDays: number }>;
  },

  async upgradeLevel(userId: string, targetLevel: 2 | 3): Promise<KYCProfile> {
    const res = await fetch('/api/payments/kyc/upgrade', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, targetLevel }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<KYCProfile>;
  },

  // ─── Business KYB ────────────────────────────────────────────────────────

  async getBusinessProfile(businessId: string): Promise<KYBProfile | null> {
    try {
      const res = await fetch(`/api/payments/kyb/profiles/${businessId}`);
      return res.ok ? res.json() as Promise<KYBProfile> : null;
    } catch { return null; }
  },

  async submitBusinessDoc(businessId: string, type: string, file: File): Promise<void> {
    const form = new FormData();
    form.append('businessId', businessId);
    form.append('type',       type);
    form.append('file',       file);
    const res = await fetch('/api/payments/kyb/documents', { method: 'POST', body: form });
    if (!res.ok) throw new Error(await res.text());
  },

  // ─── Limits ──────────────────────────────────────────────────────────────

  async getTransactionLimits(userId: string): Promise<{ daily: number; monthly: number; perTransaction: number; currency: string }> {
    try {
      const res = await fetch(`/api/payments/kyc/limits?userId=${userId}`);
      if (res.ok) return res.json() as Promise<{ daily: number; monthly: number; perTransaction: number; currency: string }>;
    } catch { /* */ }
    // Conservative defaults for unverified users
    return { daily: 50000, monthly: 200000, perTransaction: 10000, currency: 'USD' };
  },

  isVerified(profile: KYCProfile): boolean {
    return profile.status === 'verified';
  },

  needsUpgrade(profile: KYCProfile, requiredLevel: 1 | 2 | 3): boolean {
    return profile.status !== 'verified' || profile.level < requiredLevel;
  },
};
