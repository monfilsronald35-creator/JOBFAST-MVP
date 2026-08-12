// ── Migration 023: Enterprise Monetization Platform ───────────────────────
//
// SCHEMA CONFLICT WARNING: Migration 023 creates a new `subscription_plans`
// schema (plan_code/plan_name/price_monthly/price_yearly) that is incompatible
// with the existing SubscriptionPlan interface below (name/slug/price).
// The existing subscriptionService.ts queries will fail after this migration
// runs unless updated to use EnterpriseSubscriptionPlan and the new column names.
//
// Backend-only tables (zero frontend types or functions):
//   commission_rules      — base_rate + tiered_slabs_json reveal commission structure; enables exploitation
//   pricing_rules         — scaling_factors_json reveals dynamic pricing algorithm
//   platform_fees         — calculation_method + amount_or_rate expose full fee logic
//   revenue_transactions  — platform_commission/net_platform_revenue/vendor_payout_amount (NEVER)
//
// Frontend-safe tables (3 of 7):
//   subscription_plans        → EnterpriseSubscriptionPlan
//   subscription_subscribers  → SubscriptionSubscriber
//   subscription_billing_cycles → SubscriptionBillingCycle

export const PLAN_TIERS = [
  'free', 'standard', 'premium', 'business', 'enterprise', 'god_mode',
] as const;
export type PlanTier = typeof PLAN_TIERS[number];

export interface EnterpriseSubscriptionPlan {
  id: string;
  organizationId: string;
  planCode: string;
  planName: string;
  planTier: PlanTier;
  priceMonthly: number;
  priceYearly: number;
  currencyCode: string;
  quotaLimitsJson: Record<string, unknown>;
  featuresMatrixJson: unknown[];
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
}

export const SUBSCRIBER_STATUSES = [
  'trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired', 'upgraded',
] as const;
export type SubscriberStatus = typeof SUBSCRIBER_STATUSES[number];

export const BILLING_INTERVALS_V2 = ['monthly', 'yearly', 'lifetime'] as const;
export type BillingIntervalV2 = typeof BILLING_INTERVALS_V2[number];

export interface SubscriptionSubscriber {
  id: string;
  organizationId: string;
  userId: string;
  subscriptionPlanId: string;
  status: SubscriberStatus;
  billingInterval: BillingIntervalV2;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  createdAt: string;
}

export const BILLING_CYCLE_STATUSES = [
  'pending', 'invoiced', 'processing', 'paid', 'failed', 'waived',
] as const;
export type BillingCycleStatus = typeof BILLING_CYCLE_STATUSES[number];

export interface SubscriptionBillingCycle {
  id: string;
  organizationId: string;
  subscriberId: string;
  cycleIndex: number;
  billingDate: string;
  amountDue: number;
  currencyCode: string;
  billingStatus: BillingCycleStatus;
  createdAt: string;
  // retry_count excluded — internal billing retry machinery; not needed by clients
}

// ── Pre-Migration 023 types (legacy marketplace subscription schema) ────────

export const BILLING_INTERVALS = ['weekly', 'monthly', 'yearly'] as const;

export type BillingInterval = typeof BILLING_INTERVALS[number];

export const SUBSCRIPTION_STATUSES = [
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'expired',
] as const;

export type SubscriptionStatus = typeof SUBSCRIPTION_STATUSES[number];

// ---- Entity interfaces ----

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  billingInterval: string;
  features: unknown[];
  isActive: boolean;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionItem {
  id: string;
  subscriptionId: string;
  itemKey: string;
  quantity: number;
}

export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: string;
  gatewayInvoiceId: string | null;
  createdAt: string;
}
