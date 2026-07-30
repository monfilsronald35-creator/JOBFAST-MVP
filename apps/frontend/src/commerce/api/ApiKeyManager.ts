/**
 * ApiKeyManager — API key generation, validation, rate limiting.
 */

import type { ApiKey } from '../types';

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
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const ApiKeyManager = {
  async create(data: {
    name:        string;
    scopes:      string[];
    expiresAt?:  number;
    vendorId?:   string;
    orgId?:      string;
    rateLimit?:  number;
  }): Promise<ApiKey & { secret: string }> {
    return api('/api-keys', { method: 'POST', body: JSON.stringify(data) });
  },

  async list(options?: { vendorId?: string; orgId?: string }): Promise<ApiKey[]> {
    const p = new URLSearchParams();
    if (options?.vendorId) p.set('vendorId', options.vendorId);
    if (options?.orgId)    p.set('orgId',    options.orgId);
    return api(`/api-keys?${p.toString()}`);
  },

  async revoke(id: string): Promise<void> {
    await api(`/api-keys/${id}`, { method: 'DELETE' });
  },

  async rotate(id: string): Promise<{ secret: string }> {
    return api(`/api-keys/${id}/rotate`, { method: 'POST' });
  },

  async getUsage(id: string, from: number, to: number): Promise<{
    requests:  number;
    errors:    number;
    byEndpoint: Array<{ path: string; count: number; errors: number }>;
  }> {
    return api(`/api-keys/${id}/usage?from=${from}&to=${to}`);
  },

  async validate(key: string): Promise<{ valid: boolean; scopes: string[]; vendorId?: string; orgId?: string }> {
    return api('/api-keys/validate', { method: 'POST', body: JSON.stringify({ key }) });
  },
};