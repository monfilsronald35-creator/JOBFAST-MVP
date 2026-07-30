import type { Plan, Subscription, Coupon, UsageRecord, Invoice, BillingPortalSession } from '../types/subscription';

export const SubscriptionEngine = {
  async getPlans(currency?: string): Promise<Plan[]> {
    const q = currency ? `?currency=${currency}` : '';
    try {
      const res = await fetch(`/api/payments/subscriptions/plans${q}`);
      return res.ok ? res.json() as Promise<Plan[]> : [];
    } catch { return []; }
  },

  async getPlan(planId: string): Promise<Plan | null> {
    try {
      const res = await fetch(`/api/payments/subscriptions/plans/${planId}`);
      return res.ok ? res.json() as Promise<Plan> : null;
    } catch { return null; }
  },

  async create(params: { userId: string; planId: string; paymentMethodId?: string; couponCode?: string; trialDays?: number }): Promise<Subscription> {
    const res = await fetch('/api/payments/subscriptions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(params),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<Subscription>;
  },

  async get(subscriptionId: string): Promise<Subscription | null> {
    try {
      const res = await fetch(`/api/payments/subscriptions/${subscriptionId}`);
      return res.ok ? res.json() as Promise<Subscription> : null;
    } catch { return null; }
  },

  async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const res = await fetch(`/api/payments/subscriptions?userId=${userId}&status=active`);
      if (!res.ok) return null;
      const list = await res.json() as Subscription[];
      return list[0] ?? null;
    } catch { return null; }
  },

  async cancel(subscriptionId: string, immediately = false): Promise<Subscription> {
    const res = await fetch(`/api/payments/subscriptions/${subscriptionId}/cancel`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ immediately }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<Subscription>;
  },

  async upgrade(subscriptionId: string, newPlanId: string, prorate = true): Promise<Subscription> {
    const res = await fetch(`/api/payments/subscriptions/${subscriptionId}/upgrade`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ planId: newPlanId, prorate }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<Subscription>;
  },

  async pause(subscriptionId: string, resumeAt?: number): Promise<Subscription> {
    const res = await fetch(`/api/payments/subscriptions/${subscriptionId}/pause`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ resumeAt }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<Subscription>;
  },

  async recordUsage(record: UsageRecord): Promise<void> {
    await fetch('/api/payments/subscriptions/usage', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(record),
    });
  },

  async validateCoupon(code: string, planId?: string): Promise<Coupon | null> {
    const q = new URLSearchParams({ code });
    if (planId) q.set('planId', planId);
    try {
      const res = await fetch(`/api/payments/subscriptions/coupons/validate?${q}`);
      return res.ok ? res.json() as Promise<Coupon> : null;
    } catch { return null; }
  },

  async getInvoices(userId: string, limit = 10): Promise<Invoice[]> {
    try {
      const res = await fetch(`/api/payments/subscriptions/invoices?userId=${userId}&limit=${limit}`);
      return res.ok ? res.json() as Promise<Invoice[]> : [];
    } catch { return []; }
  },

  async getBillingPortal(userId: string, returnUrl: string): Promise<BillingPortalSession> {
    const res = await fetch('/api/payments/subscriptions/portal', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, returnUrl }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<BillingPortalSession>;
  },

  isActive(subscription: Subscription): boolean {
    return subscription.status === 'active' || subscription.status === 'trialing';
  },

  isTrialing(subscription: Subscription): boolean {
    return subscription.status === 'trialing' && (subscription.trialEnd ?? 0) > Date.now();
  },
};
