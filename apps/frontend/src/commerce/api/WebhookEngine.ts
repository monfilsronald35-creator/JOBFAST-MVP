/**
 * WebhookEngine — Outbound webhook dispatch with retry and signature.
 * Manages webhook endpoints, event subscriptions, and delivery logs.
 */

import type { WebhookEvent } from '../types';

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

export interface WebhookEndpoint {
  id:         string;
  url:        string;
  events:     string[];
  secret:     string;
  enabled:    boolean;
  createdAt:  number;
}

export interface WebhookDelivery {
  id:            string;
  endpointId:    string;
  eventType:     string;
  payload:       unknown;
  status:        'pending' | 'delivered' | 'failed';
  attempts:      number;
  lastAttemptAt: number;
  nextRetryAt?:  number;
  responseCode?: number;
  responseBody?: string;
}

export const WebhookEngine = {
  // ─── Endpoint management ──────────────────────────────────────────────────

  async createEndpoint(data: { url: string; events: string[]; vendorId?: string; orgId?: string }): Promise<WebhookEndpoint> {
    return api<WebhookEndpoint>('/webhooks/endpoints', { method: 'POST', body: JSON.stringify(data) });
  },

  async getEndpoints(options?: { vendorId?: string; orgId?: string }): Promise<WebhookEndpoint[]> {
    const p = new URLSearchParams();
    if (options?.vendorId) p.set('vendorId', options.vendorId);
    if (options?.orgId)    p.set('orgId',    options.orgId);
    return api<WebhookEndpoint[]>(`/webhooks/endpoints?${p.toString()}`);
  },

  async updateEndpoint(id: string, data: Partial<Pick<WebhookEndpoint, 'url' | 'events' | 'enabled'>>): Promise<WebhookEndpoint> {
    return api<WebhookEndpoint>(`/webhooks/endpoints/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  async deleteEndpoint(id: string): Promise<void> {
    await api(`/webhooks/endpoints/${id}`, { method: 'DELETE' });
  },

  async rotateSecret(id: string): Promise<{ secret: string }> {
    return api(`/webhooks/endpoints/${id}/rotate-secret`, { method: 'POST' });
  },

  async testEndpoint(id: string): Promise<{ ok: boolean; statusCode?: number; latencyMs?: number }> {
    return api(`/webhooks/endpoints/${id}/test`, { method: 'POST' });
  },

  // ─── Delivery logs ────────────────────────────────────────────────────────

  async getDeliveries(endpointId: string, options?: { page?: number; limit?: number; status?: string }): Promise<{ deliveries: WebhookDelivery[]; total: number }> {
    const p = new URLSearchParams({ endpointId });
    if (options?.page)   p.set('page',   String(options.page));
    if (options?.limit)  p.set('limit',  String(options.limit));
    if (options?.status) p.set('status', options.status);
    return api(`/webhooks/deliveries?${p.toString()}`);
  },

  async retryDelivery(deliveryId: string): Promise<WebhookDelivery> {
    return api(`/webhooks/deliveries/${deliveryId}/retry`, { method: 'POST' });
  },

  // ─── Event publishing ─────────────────────────────────────────────────────

  async publish(event: Omit<WebhookEvent, 'id' | 'createdAt' | 'response'>): Promise<void> {
    await api('/webhooks/events', { method: 'POST', body: JSON.stringify(event) });
  },
};