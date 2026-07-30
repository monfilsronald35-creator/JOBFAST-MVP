import { db }          from '../../../core/database/SupabaseClient.js';
import { AppError }    from '../../../core/errors/AppError.js';
import {
  PaymentStatus, ProviderName, RefundStatus, SubscriptionStatus, SubscriptionInterval,
  type PaymentIntent, type PaymentTransaction, type SplitRule, type SplitEntry,
  type Refund, type PaySubscription, type WebhookEvent,
} from '../types/payment.types.js';

function toIntent(r: Record<string, unknown>): PaymentIntent {
  const base: PaymentIntent = {
    id: r['id'] as string, userId: r['user_id'] as string,
    amount: r['amount'] as number, currency: r['currency'] as string,
    method: r['method'] as PaymentIntent['method'],
    status: r['status'] as PaymentStatus,
    description: r['description'] as string,
    riskScore: (r['risk_score'] as number) ?? 0,
    requires3DS: (r['requires_3ds'] as boolean) ?? false,
    metadata: (r['metadata'] as Record<string, unknown>) ?? {},
    createdAt: r['created_at'] as string, updatedAt: r['updated_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['provider'])           b['provider']          = r['provider'];
  if (r['provider_intent_id']) b['providerIntentId']  = r['provider_intent_id'];
  if (r['client_secret'])      b['clientSecret']      = r['client_secret'];
  if (r['order_id'])           b['orderId']           = r['order_id'];
  if (r['job_id'])             b['jobId']             = r['job_id'];
  if (r['escrow_id'])          b['escrowId']          = r['escrow_id'];
  if (r['subscription_id'])    b['subscriptionId']    = r['subscription_id'];
  if (r['split_rule_id'])      b['splitRuleId']       = r['split_rule_id'];
  if (r['ip_address'])         b['ipAddress']         = r['ip_address'];
  if (r['device_id'])          b['deviceId']          = r['device_id'];
  if (r['country'])            b['country']           = r['country'];
  return base;
}

function toTransaction(r: Record<string, unknown>): PaymentTransaction {
  const base: PaymentTransaction = {
    id: r['id'] as string, intentId: r['intent_id'] as string,
    provider: r['provider'] as ProviderName, amount: r['amount'] as number,
    fee: r['fee'] as number, currency: r['currency'] as string,
    status: r['status'] as PaymentStatus, attempt: r['attempt'] as number,
    createdAt: r['created_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['provider_tx_id'])  b['providerTxId']  = r['provider_tx_id'];
  if (r['error_code'])      b['errorCode']     = r['error_code'];
  if (r['error_message'])   b['errorMessage']  = r['error_message'];
  if (r['raw_response'])    b['rawResponse']   = r['raw_response'];
  return base;
}

function toRefund(r: Record<string, unknown>): Refund {
  const base: Refund = {
    id: r['id'] as string, intentId: r['intent_id'] as string,
    userId: r['user_id'] as string, amount: r['amount'] as number,
    currency: r['currency'] as string, reason: r['reason'] as string,
    status: r['status'] as RefundStatus, createdAt: r['created_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['provider_refund_id']) b['providerRefundId'] = r['provider_refund_id'];
  if (r['processed_at'])       b['processedAt']      = r['processed_at'];
  return base;
}

function toSub(r: Record<string, unknown>): PaySubscription {
  const base: PaySubscription = {
    id: r['id'] as string, userId: r['user_id'] as string,
    provider: r['provider'] as ProviderName,
    status: r['status'] as SubscriptionStatus,
    interval: r['interval'] as SubscriptionInterval,
    amount: r['amount'] as number, currency: r['currency'] as string,
    currentPeriodStart: r['current_period_start'] as string,
    currentPeriodEnd:   r['current_period_end']   as string,
    createdAt: r['created_at'] as string, updatedAt: r['updated_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['provider_sub_id']) b['providerSubId'] = r['provider_sub_id'];
  if (r['plan_id'])         b['planId']        = r['plan_id'];
  if (r['trial_ends_at'])   b['trialEndsAt']   = r['trial_ends_at'];
  if (r['cancelled_at'])    b['cancelledAt']   = r['cancelled_at'];
  return base;
}

export const PaymentRepository = {
  // ── Intents ─────────────────────────────────────────────────────────────────
  async createIntent(data: Omit<PaymentIntent, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentIntent> {
    const row: Record<string, unknown> = {
      user_id: data.userId, amount: data.amount, currency: data.currency,
      method: data.method, status: data.status, description: data.description,
      risk_score: data.riskScore ?? 0, requires_3ds: data.requires3DS ?? false,
      metadata: data.metadata ?? {},
    };
    if (data.provider)         row['provider']           = data.provider;
    if (data.providerIntentId) row['provider_intent_id'] = data.providerIntentId;
    if (data.orderId)          row['order_id']           = data.orderId;
    if (data.jobId)            row['job_id']             = data.jobId;
    if (data.splitRuleId)      row['split_rule_id']      = data.splitRuleId;
    if (data.ipAddress)        row['ip_address']         = data.ipAddress;
    if (data.deviceId)         row['device_id']          = data.deviceId;
    if (data.country)          row['country']            = data.country;
    const { data: saved, error } = await db.client()
      .from('pay_payment_intents').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create payment intent', 500, 'DB_ERROR');
    return toIntent(saved);
  },

  async findIntent(id: string): Promise<PaymentIntent | null> {
    const { data } = await db.client().from('pay_payment_intents').select('*')
      .eq('id', id).single<Record<string, unknown>>();
    return data ? toIntent(data) : null;
  },

  async updateIntent(id: string, patch: Partial<Pick<PaymentIntent,
    'status' | 'provider' | 'providerIntentId' | 'clientSecret' | 'requires3DS' | 'riskScore'
  >>): Promise<PaymentIntent> {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.status !== undefined)          row['status']             = patch.status;
    if (patch.provider !== undefined)        row['provider']           = patch.provider;
    if (patch.providerIntentId !== undefined)row['provider_intent_id'] = patch.providerIntentId;
    if (patch.clientSecret !== undefined)    row['client_secret']      = patch.clientSecret;
    if (patch.requires3DS !== undefined)     row['requires_3ds']       = patch.requires3DS;
    if (patch.riskScore !== undefined)       row['risk_score']         = patch.riskScore;
    const { data, error } = await db.client().from('pay_payment_intents')
      .update(row).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to update intent', 500, 'DB_ERROR');
    return toIntent(data);
  },

  async listIntents(userId: string, limit = 20, cursor?: string): Promise<PaymentIntent[]> {
    let q = db.client().from('pay_payment_intents').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(limit);
    if (cursor) q = q.lt('created_at', cursor);
    const { data, error } = await q.returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list intents', 500, 'DB_ERROR');
    return (data ?? []).map(toIntent);
  },

  // ── Transactions ─────────────────────────────────────────────────────────────
  async createTransaction(data: Omit<PaymentTransaction, 'id' | 'createdAt'>): Promise<PaymentTransaction> {
    const row: Record<string, unknown> = {
      intent_id: data.intentId, provider: data.provider, amount: data.amount,
      fee: data.fee, currency: data.currency, status: data.status, attempt: data.attempt,
    };
    if (data.providerTxId)  row['provider_tx_id'] = data.providerTxId;
    if (data.errorCode)     row['error_code']     = data.errorCode;
    if (data.errorMessage)  row['error_message']  = data.errorMessage;
    if (data.rawResponse)   row['raw_response']   = data.rawResponse;
    const { data: saved, error } = await db.client()
      .from('pay_transactions').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create transaction', 500, 'DB_ERROR');
    return toTransaction(saved);
  },

  async listTransactions(intentId: string): Promise<PaymentTransaction[]> {
    const { data, error } = await db.client().from('pay_transactions').select('*')
      .eq('intent_id', intentId).order('attempt', { ascending: true })
      .returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list transactions', 500, 'DB_ERROR');
    return (data ?? []).map(toTransaction);
  },

  // ── Refunds ──────────────────────────────────────────────────────────────────
  async createRefund(data: Omit<Refund, 'id' | 'createdAt'>): Promise<Refund> {
    const row: Record<string, unknown> = {
      intent_id: data.intentId, user_id: data.userId, amount: data.amount,
      currency: data.currency, reason: data.reason, status: data.status,
    };
    if (data.providerRefundId) row['provider_refund_id'] = data.providerRefundId;
    if (data.processedAt)      row['processed_at']       = data.processedAt;
    const { data: saved, error } = await db.client()
      .from('pay_refunds').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create refund', 500, 'DB_ERROR');
    return toRefund(saved);
  },

  async updateRefund(id: string, patch: Partial<Pick<Refund, 'status' | 'providerRefundId' | 'processedAt'>>): Promise<Refund> {
    const row: Record<string, unknown> = {};
    if (patch.status !== undefined)            row['status']              = patch.status;
    if (patch.providerRefundId !== undefined)  row['provider_refund_id']  = patch.providerRefundId;
    if (patch.processedAt !== undefined)       row['processed_at']        = patch.processedAt;
    const { data, error } = await db.client().from('pay_refunds')
      .update(row).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to update refund', 500, 'DB_ERROR');
    return toRefund(data);
  },

  // ── Split Rules ──────────────────────────────────────────────────────────────
  async getSplitRule(id: string): Promise<SplitRule | null> {
    const { data } = await db.client().from('pay_split_rules').select('*')
      .eq('id', id).eq('is_active', true).single<Record<string, unknown>>();
    if (!data) return null;
    return {
      id: data['id'] as string, name: data['name'] as string,
      context: data['context'] as string,
      entries: data['entries'] as SplitRule['entries'],
      isActive: data['is_active'] as boolean, createdAt: data['created_at'] as string,
    };
  },

  async getSplitRuleByContext(context: string): Promise<SplitRule | null> {
    const { data } = await db.client().from('pay_split_rules').select('*')
      .eq('context', context).eq('is_active', true).single<Record<string, unknown>>();
    if (!data) return null;
    return {
      id: data['id'] as string, name: data['name'] as string,
      context: data['context'] as string,
      entries: data['entries'] as SplitRule['entries'],
      isActive: data['is_active'] as boolean, createdAt: data['created_at'] as string,
    };
  },

  async createSplitEntries(entries: Array<Omit<SplitEntry, 'id' | 'createdAt'>>): Promise<void> {
    if (entries.length === 0) return;
    const rows = entries.map(e => ({
      intent_id: e.intentId, recipient: e.recipient, amount: e.amount,
      currency: e.currency, status: e.status,
    }));
    const { error } = await db.client().from('pay_split_entries').insert(rows);
    if (error) throw new AppError('Failed to create split entries', 500, 'DB_ERROR');
  },

  // ── Subscriptions ────────────────────────────────────────────────────────────
  async createSubscription(data: Omit<PaySubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaySubscription> {
    const row: Record<string, unknown> = {
      user_id: data.userId, provider: data.provider, status: data.status,
      interval: data.interval, amount: data.amount, currency: data.currency,
      current_period_start: data.currentPeriodStart, current_period_end: data.currentPeriodEnd,
    };
    if (data.providerSubId) row['provider_sub_id'] = data.providerSubId;
    if (data.planId)        row['plan_id']         = data.planId;
    if (data.trialEndsAt)   row['trial_ends_at']   = data.trialEndsAt;
    const { data: saved, error } = await db.client()
      .from('pay_subscriptions').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create subscription', 500, 'DB_ERROR');
    return toSub(saved);
  },

  async updateSubscription(id: string, patch: Partial<Pick<PaySubscription,
    'status' | 'currentPeriodStart' | 'currentPeriodEnd' | 'cancelledAt'
  >>): Promise<PaySubscription> {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.status !== undefined)               row['status']                = patch.status;
    if (patch.currentPeriodStart !== undefined)   row['current_period_start']  = patch.currentPeriodStart;
    if (patch.currentPeriodEnd !== undefined)     row['current_period_end']    = patch.currentPeriodEnd;
    if (patch.cancelledAt !== undefined)          row['cancelled_at']          = patch.cancelledAt;
    const { data, error } = await db.client().from('pay_subscriptions')
      .update(row).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to update subscription', 500, 'DB_ERROR');
    return toSub(data);
  },

  async listSubscriptions(userId: string): Promise<PaySubscription[]> {
    const { data, error } = await db.client().from('pay_subscriptions').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false })
      .returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list subscriptions', 500, 'DB_ERROR');
    return (data ?? []).map(toSub);
  },

  // ── Webhooks ─────────────────────────────────────────────────────────────────
  async saveWebhook(provider: string, eventType: string, payload: Record<string, unknown>): Promise<string> {
    const { data, error } = await db.client().from('pay_webhooks')
      .insert({ provider, event_type: eventType, payload })
      .select('id').single<{ id: string }>();
    if (error ?? !data) throw new AppError('Failed to save webhook', 500, 'DB_ERROR');
    return data.id;
  },

  async markWebhookProcessed(id: string): Promise<void> {
    await db.client().from('pay_webhooks')
      .update({ processed: true, processed_at: new Date().toISOString() }).eq('id', id);
  },

  // ── Route Logs ───────────────────────────────────────────────────────────────
  async logRoute(intentId: string, selectedProvider: string, candidates: unknown[], reason: string): Promise<void> {
    await db.client().from('pay_route_logs').insert({
      intent_id: intentId, selected_provider: selectedProvider,
      candidates, reason,
    }).then(() => undefined);
  },
};
