import { PaymentRepository } from '../repositories/PaymentRepository.js';
import { ProviderRegistry }  from '../providers/ProviderAdapter.js';
import { AppError }          from '../../../core/errors/AppError.js';
import { SubscriptionStatus, SubscriptionInterval, ProviderName } from '../types/payment.types.js';
import type { PaySubscription } from '../types/payment.types.js';

function nextPeriodEnd(start: Date, interval: SubscriptionInterval): Date {
  const d = new Date(start);
  if (interval === SubscriptionInterval.Weekly)  { d.setDate(d.getDate() + 7); return d; }
  if (interval === SubscriptionInterval.Monthly) { d.setMonth(d.getMonth() + 1); return d; }
  if (interval === SubscriptionInterval.Yearly)  { d.setFullYear(d.getFullYear() + 1); return d; }
  return d;
}

export const SubscriptionBillingService = {
  async create(userId: string, opts: {
    provider?: ProviderName; planId?: string; interval: SubscriptionInterval;
    amount: number; currency: string; trialDays?: number;
  }): Promise<PaySubscription> {
    const now      = new Date();
    const provider = opts.provider ?? ProviderName.Stripe;
    const adapter  = ProviderRegistry.get(provider);

    const { subscriptionId } = await adapter.createSubscription(
      opts.planId ?? 'custom', userId, opts.amount, opts.currency, opts.interval
    );

    const trialEndsAt = opts.trialDays
      ? new Date(now.getTime() + opts.trialDays * 86400_000).toISOString()
      : undefined;

    const periodEnd = nextPeriodEnd(now, opts.interval);
    const status    = opts.trialDays ? SubscriptionStatus.Trial : SubscriptionStatus.Active;

    const sub: Parameters<typeof PaymentRepository.createSubscription>[0] = {
      userId, provider, status, interval: opts.interval,
      amount: opts.amount, currency: opts.currency,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd:   periodEnd.toISOString(),
      providerSubId: subscriptionId,
    };
    const s = sub as unknown as Record<string, unknown>;
    if (opts.planId)   s['planId']     = opts.planId;
    if (trialEndsAt)   s['trialEndsAt'] = trialEndsAt;

    return PaymentRepository.createSubscription(sub);
  },

  async cancel(subscriptionId: string, userId: string): Promise<PaySubscription> {
    const subs = await PaymentRepository.listSubscriptions(userId);
    const sub  = subs.find(s => s.id === subscriptionId);
    if (!sub) throw new AppError('Subscription not found', 404, 'NOT_FOUND');

    if (sub.providerSubId) {
      const adapter = ProviderRegistry.get(sub.provider);
      await adapter.cancelSubscription(sub.providerSubId).catch(() => undefined);
    }

    return PaymentRepository.updateSubscription(subscriptionId, {
      status: SubscriptionStatus.Cancelled,
      cancelledAt: new Date().toISOString(),
    });
  },

  async renew(subscriptionId: string, userId: string): Promise<PaySubscription> {
    const subs = await PaymentRepository.listSubscriptions(userId);
    const sub  = subs.find(s => s.id === subscriptionId);
    if (!sub) throw new AppError('Subscription not found', 404, 'NOT_FOUND');

    const periodStart = new Date();
    const periodEnd   = nextPeriodEnd(periodStart, sub.interval);

    return PaymentRepository.updateSubscription(subscriptionId, {
      status: SubscriptionStatus.Active,
      currentPeriodStart: periodStart.toISOString(),
      currentPeriodEnd:   periodEnd.toISOString(),
    });
  },

  async list(userId: string): Promise<PaySubscription[]> {
    return PaymentRepository.listSubscriptions(userId);
  },
};
