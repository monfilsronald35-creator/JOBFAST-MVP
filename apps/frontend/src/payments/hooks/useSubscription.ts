import { useState, useEffect, useCallback } from 'react';
import type { Subscription, Plan, Invoice, Coupon } from '../types/subscription';
import { SubscriptionEngine } from '../engines/SubscriptionEngine';

export function useSubscription(userId: string) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans,        setPlans]        = useState<Plan[]>([]);
  const [invoices,     setInvoices]     = useState<Invoice[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sub, pl, inv] = await Promise.all([
        SubscriptionEngine.getUserSubscription(userId),
        SubscriptionEngine.getPlans(),
        SubscriptionEngine.getInvoices(userId),
      ]);
      setSubscription(sub);
      setPlans(pl);
      setInvoices(inv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { if (userId) void load(); }, [load, userId]);

  const subscribe = useCallback(async (planId: string, paymentMethodId?: string, couponCode?: string): Promise<Subscription> => {
    setLoading(true);
    setError(null);
    try {
      const sub = await SubscriptionEngine.create({ userId, planId, paymentMethodId, couponCode });
      setSubscription(sub);
      return sub;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Subscription failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const cancel = useCallback(async (immediately = false) => {
    if (!subscription) return;
    setLoading(true);
    try {
      const updated = await SubscriptionEngine.cancel(subscription.id, immediately);
      setSubscription(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  const upgrade = useCallback(async (newPlanId: string) => {
    if (!subscription) return;
    setLoading(true);
    try {
      const updated = await SubscriptionEngine.upgrade(subscription.id, newPlanId);
      setSubscription(updated);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade failed');
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  const validateCoupon = useCallback(async (code: string): Promise<Coupon | null> => {
    return SubscriptionEngine.validateCoupon(code, subscription?.planId);
  }, [subscription]);

  const isActive     = subscription ? SubscriptionEngine.isActive(subscription) : false;
  const isTrialing   = subscription ? SubscriptionEngine.isTrialing(subscription) : false;
  const currentPlan  = plans.find(p => p.id === subscription?.planId) ?? null;

  return { subscription, plans, invoices, loading, error, isActive, isTrialing, currentPlan, subscribe, cancel, upgrade, validateCoupon, refresh: load };
}
