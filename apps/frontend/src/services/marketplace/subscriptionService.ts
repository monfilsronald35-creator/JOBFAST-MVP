import { supabase } from '../../lib/supabase';
import type {
  SubscriptionPlan,
  Subscription,
  SubscriptionItem,
  SubscriptionPayment,
  SubscriptionStatus,
} from '../../types/subscriptions';

// ---- Row types (snake_case) ----

type SubscriptionPlanRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  billing_interval: string;
  features: unknown[];
  is_active: boolean;
  created_at: string;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

type SubscriptionItemRow = {
  id: string;
  subscription_id: string;
  item_key: string;
  quantity: number;
};

type SubscriptionPaymentRow = {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: string;
  gateway_invoice_id: string | null;
  created_at: string;
};

// ---- Mappers ----

function mapPlan(r: SubscriptionPlanRow): SubscriptionPlan {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    price: r.price,
    billingInterval: r.billing_interval,
    features: r.features,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function mapSubscription(r: SubscriptionRow): Subscription {
  return {
    id: r.id,
    userId: r.user_id,
    planId: r.plan_id,
    status: r.status as SubscriptionStatus,
    currentPeriodStart: r.current_period_start,
    currentPeriodEnd: r.current_period_end,
    cancelAtPeriodEnd: r.cancel_at_period_end,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapSubscriptionItem(r: SubscriptionItemRow): SubscriptionItem {
  return {
    id: r.id,
    subscriptionId: r.subscription_id,
    itemKey: r.item_key,
    quantity: r.quantity,
  };
}

function mapSubscriptionPayment(r: SubscriptionPaymentRow): SubscriptionPayment {
  return {
    id: r.id,
    subscriptionId: r.subscription_id,
    amount: r.amount,
    currency: r.currency,
    status: r.status,
    gatewayInvoiceId: r.gateway_invoice_id,
    createdAt: r.created_at,
  };
}

// ================================================================
// === Subscription Plans
// ================================================================

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });
  if (error) throw error;
  return (data as SubscriptionPlanRow[]).map(mapPlan);
}

export async function getSubscriptionPlanBySlug(
  slug: string
): Promise<SubscriptionPlan | null> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPlan(data as SubscriptionPlanRow) : null;
}

// ================================================================
// === Subscriptions
// ================================================================

export async function getMySubscriptions(): Promise<Subscription[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as SubscriptionRow[]).map(mapSubscription);
}

export async function getMyActiveSubscription(): Promise<Subscription | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSubscription(data as SubscriptionRow) : null;
}

export async function scheduleSubscriptionCancellation(
  subscriptionId: string
): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ cancel_at_period_end: true })
    .eq('id', subscriptionId)
    .select('*')
    .single();
  if (error) throw error;
  return mapSubscription(data as SubscriptionRow);
}

export async function getSubscriptionsByStatus(
  status: SubscriptionStatus
): Promise<Subscription[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', status)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as SubscriptionRow[]).map(mapSubscription);
}

// ================================================================
// === Subscription Items
// ================================================================

export async function getSubscriptionItems(
  subscriptionId: string
): Promise<SubscriptionItem[]> {
  const { data, error } = await supabase
    .from('subscription_items')
    .select('*')
    .eq('subscription_id', subscriptionId);
  if (error) throw error;
  return (data as SubscriptionItemRow[]).map(mapSubscriptionItem);
}

// ================================================================
// === Subscription Payments
// ================================================================

export async function getSubscriptionPayments(
  subscriptionId: string
): Promise<SubscriptionPayment[]> {
  const { data, error } = await supabase
    .from('subscription_payments')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as SubscriptionPaymentRow[]).map(mapSubscriptionPayment);
}
