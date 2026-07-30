import { MarketRepository }           from '../repositories/MarketRepository.js';
import { AppError }                   from '../../../core/errors/AppError.js';
import { SubscriptionStatus, SubscriptionInterval, type SubscriptionPlan, type Subscription } from '../types/commerce.types.js';

function nextPeriodEnd(start: Date, interval: SubscriptionInterval): Date {
  const d = new Date(start);
  if (interval === SubscriptionInterval.Monthly)   d.setMonth(d.getMonth() + 1);
  if (interval === SubscriptionInterval.Quarterly) d.setMonth(d.getMonth() + 3);
  if (interval === SubscriptionInterval.Yearly)    d.setFullYear(d.getFullYear() + 1);
  return d;
}

export const SubscriptionService = {
  async createPlan(sellerId: string, data: Omit<SubscriptionPlan, 'id' | 'sellerId' | 'createdAt'>): Promise<SubscriptionPlan> {
    return MarketRepository.createPlan({ ...data, sellerId });
  },

  async getPlan(id: string): Promise<SubscriptionPlan> {
    const plan = await MarketRepository.findPlan(id);
    if (!plan) throw new AppError('Plan not found', 404, 'NOT_FOUND');
    return plan;
  },

  async subscribe(subscriberId: string, planId: string): Promise<Subscription> {
    const plan = await MarketRepository.findPlan(planId);
    if (!plan || !plan.isActive) throw new AppError('Plan not available', 404, 'NOT_FOUND');
    const now   = new Date();
    const start = plan.trialDays > 0 ? new Date(now.getTime() + plan.trialDays * 86400000) : now;
    const end   = nextPeriodEnd(start, plan.interval);
    const base: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'> = {
      planId, subscriberId, sellerId: plan.sellerId,
      status: plan.trialDays > 0 ? SubscriptionStatus.Trialing : SubscriptionStatus.Active,
      currentPeriodStart: start.toISOString(),
      currentPeriodEnd:   end.toISOString(),
    };
    if (plan.trialDays > 0) {
      (base as unknown as Record<string, unknown>)['trialEnd'] = start.toISOString();
    }
    return MarketRepository.createSubscription(base);
  },

  async cancel(subscriptionId: string, subscriberId: string): Promise<Subscription> {
    const sub = (await MarketRepository.listSubscriptions(subscriberId))
      .find(s => s.id === subscriptionId);
    if (!sub) throw new AppError('Subscription not found', 404, 'NOT_FOUND');
    return MarketRepository.updateSubscription(subscriptionId, {
      status: SubscriptionStatus.Cancelled, cancelled_at: new Date().toISOString(),
    });
  },

  async renew(subscriptionId: string): Promise<Subscription> {
    const { data } = await import('../../../core/database/SupabaseClient.js')
      .then(m => m.db.client().from('mp_subscriptions').select('*').eq('id', subscriptionId)
        .single<Record<string, unknown>>());
    if (!data) throw new AppError('Subscription not found', 404, 'NOT_FOUND');
    const planId = data['plan_id'] as string;
    const plan = await MarketRepository.findPlan(planId);
    if (!plan) throw new AppError('Plan not found', 404, 'NOT_FOUND');
    const start = new Date(data['current_period_end'] as string);
    const end   = nextPeriodEnd(start, plan.interval);
    return MarketRepository.updateSubscription(subscriptionId, {
      status: SubscriptionStatus.Active,
      current_period_start: start.toISOString(),
      current_period_end:   end.toISOString(),
    });
  },

  async list(subscriberId: string): Promise<Subscription[]> {
    return MarketRepository.listSubscriptions(subscriberId);
  },
};
