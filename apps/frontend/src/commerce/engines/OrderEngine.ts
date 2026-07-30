/**
 * OrderEngine — Full order lifecycle management.
 * Handles creation, status transitions, fulfillment, cancellation, refunds.
 */

import type { Order, Cart, OrderStatus, MultiVendorSplit } from '../types';
import { PricingEngine } from './PricingEngine';

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

export interface CreateOrderParams {
  cart:              Cart;
  shippingAddressId?: string;
  billingAddressId?:  string;
  paymentMethodId?:   string;
  notes?:             string;
  customerNote?:      string;
}

export const OrderEngine = {
  async createFromCart(params: CreateOrderParams): Promise<Order> {
    return api<Order>('/orders', { method: 'POST', body: JSON.stringify(params) });
  },

  async getOrder(id: string): Promise<Order> {
    return api<Order>(`/orders/${id}`);
  },

  async getMyOrders(options?: { status?: OrderStatus; page?: number; limit?: number }): Promise<{ orders: Order[]; total: number }> {
    const p = new URLSearchParams();
    if (options?.status) p.set('status', options.status);
    if (options?.page)   p.set('page',   String(options.page));
    if (options?.limit)  p.set('limit',  String(options.limit));
    return api(`/orders/me?${p.toString()}`);
  },

  async getVendorOrders(vendorId: string, options?: { status?: OrderStatus; page?: number; limit?: number }): Promise<{ orders: Order[]; total: number }> {
    const p = new URLSearchParams({ vendorId });
    if (options?.status) p.set('status', options.status);
    if (options?.page)   p.set('page',   String(options.page));
    if (options?.limit)  p.set('limit',  String(options.limit));
    return api(`/orders?${p.toString()}`);
  },

  async confirmOrder(id: string): Promise<Order> {
    return api<Order>(`/orders/${id}/confirm`, { method: 'POST' });
  },

  async cancelOrder(id: string, reason: string): Promise<Order> {
    return api<Order>(`/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
  },

  async updateFulfillment(
    orderId:  string,
    itemId:   string,
    update:   {
      status?:       string;
      trackingCode?: string;
      trackingUrl?:  string;
      downloadUrl?:  string;
      redeemCode?:   string;
    },
  ): Promise<Order> {
    return api<Order>(`/orders/${orderId}/items/${itemId}/fulfillment`, {
      method: 'PATCH',
      body:   JSON.stringify(update),
    });
  },

  async markDelivered(orderId: string): Promise<Order> {
    return api<Order>(`/orders/${orderId}/deliver`, { method: 'POST' });
  },

  async requestRefund(
    orderId:  string,
    itemIds:  string[],
    reason:   string,
    amount?:  number,
  ): Promise<Order> {
    return api<Order>(`/orders/${orderId}/refund`, {
      method: 'POST',
      body:   JSON.stringify({ itemIds, reason, amount }),
    });
  },

  async addNote(orderId: string, note: string): Promise<Order> {
    return api<Order>(`/orders/${orderId}/notes`, {
      method: 'POST',
      body:   JSON.stringify({ note }),
    });
  },

  async generateInvoice(orderId: string): Promise<{ url: string }> {
    return api(`/orders/${orderId}/invoice`, { method: 'POST' });
  },

  calculateVendorSplits(order: Order, commissionRates: Record<string, number>): MultiVendorSplit[] {
    const byVendor = new Map<string, typeof order.items>();
    for (const item of order.items) {
      const list = byVendor.get(item.vendorId) ?? [];
      list.push(item);
      byVendor.set(item.vendorId, list);
    }

    return Array.from(byVendor.entries()).map(([vendorId, items]) => {
      const subtotal   = items.reduce((sum, i) => sum + i.totalPrice, 0);
      const rate       = commissionRates[vendorId] ?? 10;
      const split      = PricingEngine.applyCommission(subtotal, rate);
      return {
        vendorId,
        items:      items.map(i => i.id),
        subtotal,
        commission: split.commission,
        payout:     split.net,
        currency:   order.totals.currency,
        status:     order.status,
      };
    });
  },

  isTerminal(status: OrderStatus): boolean {
    return ['completed', 'cancelled', 'refunded', 'failed'].includes(status);
  },

  canCancel(status: OrderStatus): boolean {
    return ['pending_payment', 'paid', 'confirmed', 'processing'].includes(status);
  },

  canRefund(status: OrderStatus): boolean {
    return ['paid', 'confirmed', 'processing', 'ready', 'delivered', 'completed'].includes(status);
  },
};