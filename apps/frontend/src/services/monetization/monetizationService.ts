import { supabase } from '../../lib/supabase';
import type {
  EnterpriseSubscriptionPlan,
  PlanTier,
  SubscriptionSubscriber,
  SubscriberStatus,
  SubscriptionBillingCycle,
  BillingCycleStatus,
  BillingIntervalV2,
} from '../../types/subscriptions';

// Backend-only tables — zero frontend code (4 of 7 tables):
//   commission_rules      — base_rate + tiered_slabs_json reveal commission tiers; enables exploitation
//   pricing_rules         — scaling_factors_json reveals dynamic pricing algorithm
//   platform_fees         — calculation_method + amount_or_rate expose full fee calculation logic
//   revenue_transactions  — platform_commission/net_platform_revenue/vendor_payout_amount (NEVER:
//                           internal platform revenue metrics; users see transaction status via wallet)

// ── Column constants ───────────────────────────────────────────────────────

const PLAN_COLS =
  'id, organization_id, plan_code, plan_name, plan_tier, price_monthly, price_yearly, currency_code, quota_limits_json, features_matrix_json, is_public, is_active, created_at';

const SUBSCRIBER_COLS =
  'id, organization_id, user_id, subscription_plan_id, status, billing_interval, current_period_start, current_period_end, cancel_at_period_end, trial_ends_at, created_at';

const BILLING_CYCLE_COLS =
  'id, organization_id, subscriber_id, cycle_index, billing_date, amount_due, currency_code, billing_status, created_at';
// retry_count excluded — internal billing retry machinery

// ── Row types ─────────────────────────────────────────────────────────────

type PlanRow = {
  id: string;
  organization_id: string;
  plan_code: string;
  plan_name: string;
  plan_tier: PlanTier;
  price_monthly: number;
  price_yearly: number;
  currency_code: string;
  quota_limits_json: Record<string, unknown>;
  features_matrix_json: unknown[];
  is_public: boolean;
  is_active: boolean;
  created_at: string;
};

type SubscriberRow = {
  id: string;
  organization_id: string;
  user_id: string;
  subscription_plan_id: string;
  status: SubscriberStatus;
  billing_interval: BillingIntervalV2;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_ends_at: string | null;
  created_at: string;
};

type BillingCycleRow = {
  id: string;
  organization_id: string;
  subscriber_id: string;
  cycle_index: number;
  billing_date: string;
  amount_due: number;
  currency_code: string;
  billing_status: BillingCycleStatus;
  created_at: string;
};

// ── Mappers ───────────────────────────────────────────────────────────────

function mapPlan(r: PlanRow): EnterpriseSubscriptionPlan {
  return {
    id: r.id,
    organizationId: r.organization_id,
    planCode: r.plan_code,
    planName: r.plan_name,
    planTier: r.plan_tier,
    priceMonthly: r.price_monthly,
    priceYearly: r.price_yearly,
    currencyCode: r.currency_code,
    quotaLimitsJson: r.quota_limits_json,
    featuresMatrixJson: r.features_matrix_json,
    isPublic: r.is_public,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function mapSubscriber(r: SubscriberRow): SubscriptionSubscriber {
  return {
    id: r.id,
    organizationId: r.organization_id,
    userId: r.user_id,
    subscriptionPlanId: r.subscription_plan_id,
    status: r.status,
    billingInterval: r.billing_interval,
    currentPeriodStart: r.current_period_start,
    currentPeriodEnd: r.current_period_end,
    cancelAtPeriodEnd: r.cancel_at_period_end,
    trialEndsAt: r.trial_ends_at,
    createdAt: r.created_at,
  };
}

function mapBillingCycle(r: BillingCycleRow): SubscriptionBillingCycle {
  return {
    id: r.id,
    organizationId: r.organization_id,
    subscriberId: r.subscriber_id,
    cycleIndex: r.cycle_index,
    billingDate: r.billing_date,
    amountDue: r.amount_due,
    currencyCode: r.currency_code,
    billingStatus: r.billing_status,
    createdAt: r.created_at,
  };
}

// ── Subscription Plan functions ───────────────────────────────────────────

export async function getPublicSubscriptionPlans(options: {
  planTier?: PlanTier;
} = {}): Promise<EnterpriseSubscriptionPlan[]> {
  let q = supabase
    .from('subscription_plans')
    .select(PLAN_COLS)
    .eq('is_public', true)
    .eq('is_active', true);

  if (options.planTier) q = q.eq('plan_tier', options.planTier);

  const { data, error } = await q
    .order('price_monthly', { ascending: true });
  if (error) throw error;
  return (data as PlanRow[]).map(mapPlan);
}

export async function getSubscriptionPlan(id: string): Promise<EnterpriseSubscriptionPlan | null> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select(PLAN_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapPlan(data as PlanRow) : null;
}

export async function getSubscriptionPlanByCode(
  planCode: string
): Promise<EnterpriseSubscriptionPlan | null> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select(PLAN_COLS)
    .eq('plan_code', planCode)
    .single();
  if (error) throw error;
  return data ? mapPlan(data as PlanRow) : null;
}

export async function getSubscriptionPlansByTier(
  planTier: PlanTier
): Promise<EnterpriseSubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select(PLAN_COLS)
    .eq('plan_tier', planTier)
    .eq('is_active', true)
    .order('price_monthly', { ascending: true });
  if (error) throw error;
  return (data as PlanRow[]).map(mapPlan);
}

// ── Subscription Subscriber functions ────────────────────────────────────

export async function getMySubscriber(): Promise<SubscriptionSubscriber | null> {
  const { data, error } = await supabase
    .from('subscription_subscribers')
    .select(SUBSCRIBER_COLS)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data ? mapSubscriber(data as SubscriberRow) : null;
}

export async function getMyActiveSubscriber(): Promise<SubscriptionSubscriber | null> {
  const { data, error } = await supabase
    .from('subscription_subscribers')
    .select(SUBSCRIBER_COLS)
    .in('status', ['active', 'trialing'])
    .gt('current_period_end', new Date().toISOString())
    .order('current_period_end', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data ? mapSubscriber(data as SubscriberRow) : null;
}

export async function getMySubscriptionHistory(options: {
  status?: SubscriberStatus;
  limit?: number;
  before?: string;
} = {}): Promise<SubscriptionSubscriber[]> {
  let q = supabase
    .from('subscription_subscribers')
    .select(SUBSCRIBER_COLS);

  if (options.status) q = q.eq('status', options.status);
  if (options.before) q = q.lt('created_at', options.before);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 20);
  if (error) throw error;
  return (data as SubscriberRow[]).map(mapSubscriber);
}

// ── Subscription Billing Cycle functions ─────────────────────────────────

export async function getMyBillingCycles(
  subscriberId: string,
  options: {
    billingStatus?: BillingCycleStatus;
    limit?: number;
    before?: string;
  } = {}
): Promise<SubscriptionBillingCycle[]> {
  let q = supabase
    .from('subscription_billing_cycles')
    .select(BILLING_CYCLE_COLS)
    .eq('subscriber_id', subscriberId);

  if (options.billingStatus) q = q.eq('billing_status', options.billingStatus);
  if (options.before) q = q.lt('billing_date', options.before);

  const { data, error } = await q
    .order('billing_date', { ascending: false })
    .limit(options.limit ?? 24);
  if (error) throw error;
  return (data as BillingCycleRow[]).map(mapBillingCycle);
}

export async function getMyPendingBilling(
  subscriberId: string
): Promise<SubscriptionBillingCycle[]> {
  const { data, error } = await supabase
    .from('subscription_billing_cycles')
    .select(BILLING_CYCLE_COLS)
    .eq('subscriber_id', subscriberId)
    .in('billing_status', ['pending', 'invoiced', 'failed'])
    .order('billing_date', { ascending: true });
  if (error) throw error;
  return (data as BillingCycleRow[]).map(mapBillingCycle);
}

export async function getBillingCycle(id: string): Promise<SubscriptionBillingCycle | null> {
  const { data, error } = await supabase
    .from('subscription_billing_cycles')
    .select(BILLING_CYCLE_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapBillingCycle(data as BillingCycleRow) : null;
}
