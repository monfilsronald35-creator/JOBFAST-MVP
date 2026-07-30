/**
 * VendorRegistry — Multi-vendor registration, plan management, metrics.
 */

import type { Vendor, VendorType, VendorTier, VendorMetrics, VendorSettings } from '../types';

function getAuth(): string {
  try {
    const u = JSON.parse(localStorage.getItem('jobfast_user') ?? '{}') as { token?: string };
    return u.token ? `Bearer ${u.token}` : '';
  } catch { return ''; }
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: getAuth(), ...(init.headers as Record<string, string> ?? {}) },
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ message: `HTTP ${res.status}` })) as { message?: string };
    throw new Error(e.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const VendorRegistry = {
  // ─── Registration ─────────────────────────────────────────────────────────

  async register(data: {
    type:     VendorType;
    name:     string;
    slug:     string;
    email:    string;
    phone?:   string;
    country:  string;
    currency: string;
    orgId?:   string;
  }): Promise<Vendor> {
    return api<Vendor>('/vendors/register', { method: 'POST', body: JSON.stringify(data) });
  },

  async getVendor(id: string): Promise<Vendor> {
    return api<Vendor>(`/vendors/${id}`);
  },

  async getMyVendors(): Promise<Vendor[]> {
    return api<Vendor[]>('/vendors/me');
  },

  async update(id: string, data: Partial<Vendor>): Promise<Vendor> {
    return api<Vendor>(`/vendors/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  async updateSettings(id: string, settings: Partial<VendorSettings>): Promise<Vendor> {
    return api<Vendor>(`/vendors/${id}/settings`, { method: 'PATCH', body: JSON.stringify(settings) });
  },

  async updateTier(id: string, tier: VendorTier): Promise<Vendor> {
    return api<Vendor>(`/vendors/${id}/tier`, { method: 'PATCH', body: JSON.stringify({ tier }) });
  },

  async suspend(id: string, reason: string): Promise<Vendor> {
    return api<Vendor>(`/vendors/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason }) });
  },

  async activate(id: string): Promise<Vendor> {
    return api<Vendor>(`/vendors/${id}/activate`, { method: 'POST' });
  },

  // ─── Metrics ──────────────────────────────────────────────────────────────

  async getMetrics(id: string, period?: 'day' | 'week' | 'month' | 'year'): Promise<VendorMetrics> {
    const q = period ? `?period=${period}` : '';
    return api<VendorMetrics>(`/vendors/${id}/metrics${q}`);
  },

  async getEarnings(id: string, from: number, to: number): Promise<{
    gross: number; commission: number; net: number; currency: string;
  }> {
    return api(`/vendors/${id}/earnings?from=${from}&to=${to}`);
  },

  async getPayouts(id: string, options?: { page?: number; limit?: number }): Promise<{
    payouts: Array<{ id: string; amount: number; currency: string; status: string; date: number }>;
    total: number;
  }> {
    const p = new URLSearchParams();
    if (options?.page)  p.set('page',  String(options.page));
    if (options?.limit) p.set('limit', String(options.limit));
    return api(`/vendors/${id}/payouts?${p.toString()}`);
  },

  async requestPayout(id: string, amount: number, currency: string): Promise<{ id: string; status: string }> {
    return api(`/vendors/${id}/payouts`, { method: 'POST', body: JSON.stringify({ amount, currency }) });
  },

  // ─── Discovery ────────────────────────────────────────────────────────────

  async search(options: {
    type?:    VendorType;
    country?: string;
    tier?:    VendorTier;
    q?:       string;
    page?:    number;
    limit?:   number;
  }): Promise<{ vendors: Vendor[]; total: number }> {
    const p = new URLSearchParams();
    if (options.type)    p.set('type',    options.type);
    if (options.country) p.set('country', options.country);
    if (options.tier)    p.set('tier',    options.tier);
    if (options.q)       p.set('q',       options.q);
    if (options.page)    p.set('page',    String(options.page));
    if (options.limit)   p.set('limit',   String(options.limit));
    return api(`/vendors?${p.toString()}`);
  },

  // ─── Reviews ──────────────────────────────────────────────────────────────

  async getReviews(id: string, page = 1, limit = 20): Promise<{ reviews: unknown[]; average: number; total: number }> {
    return api(`/vendors/${id}/reviews?page=${page}&limit=${limit}`);
  },

  async addReview(id: string, data: { rating: number; comment?: string; orderId: string }): Promise<void> {
    await api(`/vendors/${id}/reviews`, { method: 'POST', body: JSON.stringify(data) });
  },
};