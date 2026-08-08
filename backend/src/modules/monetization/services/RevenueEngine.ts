import { db } from '../../../core/database/SupabaseClient.js';
import { MonetizationConfigService } from './MonetizationConfigService.js';
import { FreeTierEngine } from './FreeTierEngine.js';
import type { FeeCalculation, FeeRule, MonetizationService } from '../types/monetization.types.js';

export interface FeeParams {
  service: MonetizationService;
  amount: number;
  currency: string;
  country?: string;
  city?: string;
  userType?: string;
  userId?: string;
}

export interface RecordParams {
  service: MonetizationService;
  userId?: string;
  transactionRef?: string;
  originalAmount: number;
  feeAmount: number;
  currency: string;
  country?: string;
  city?: string;
  userType?: string;
  ruleId?: string;
  isFree: boolean;
  freeReason?: string;
  metadata?: Record<string, unknown>;
}

export const RevenueEngine = {
  async calculateFee(params: FeeParams): Promise<FeeCalculation> {
    const { service, amount, currency, country, city, userType, userId } = params;

    const enabled = await MonetizationConfigService.isEnabled(service);
    if (!enabled) return _zero(service, amount, currency, 'monetization_disabled');

    if (userId) {
      const free = await FreeTierEngine.isInFreeTier(userId, service, userType);
      if (free.isFree) return _zero(service, amount, currency, free.reason);
    }

    const txCount = userId ? await RevenueEngine.getTransactionCount(userId) : 0;
    const rules   = await MonetizationConfigService.getFeeRules(service);
    const rule    = _selectRule(rules, { country, city, userType, txCount });

    if (!rule) return _zero(service, amount, currency, 'no_rule');

    let feeAmount  = 0;
    let feePercent = 0;

    if (rule.ratePercent !== undefined && rule.ratePercent > 0) {
      feeAmount  = Math.round(amount * rule.ratePercent / 100);
      feePercent = rule.ratePercent;
    } else if (rule.fixedAmount !== undefined && rule.fixedAmount > 0) {
      feeAmount  = rule.fixedAmount;
      feePercent = amount > 0 ? (rule.fixedAmount / amount) * 100 : 0;
    }

    const result: FeeCalculation = {
      service,
      originalAmount: amount,
      feeAmount,
      feePercent,
      totalAmount: amount + feeAmount,
      currency,
      isFree: false,
    };
    if (rule.id) result.ruleId = rule.id;
    return result;
  },

  async recordEvent(params: RecordParams): Promise<string> {
    const payload: Record<string, unknown> = {
      service:         params.service,
      original_amount: params.originalAmount,
      fee_amount:      params.feeAmount,
      total_amount:    params.originalAmount + params.feeAmount,
      currency:        params.currency,
      is_free:         params.isFree,
      status:          'collected',
    };
    if (params.userId)         payload['user_id']         = params.userId;
    if (params.transactionRef) payload['transaction_ref'] = params.transactionRef;
    if (params.country)        payload['country']         = params.country;
    if (params.city)           payload['city']            = params.city;
    if (params.userType)       payload['user_type']       = params.userType;
    if (params.ruleId)         payload['rule_id']         = params.ruleId;
    if (params.freeReason)     payload['free_reason']     = params.freeReason;
    if (params.metadata)       payload['metadata']        = params.metadata;

    const { data, error } = await db.client()
      .from('mon_revenue_events')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    return (data as Record<string, unknown>)['id'] as string;
  },

  async getTransactionCount(userId: string): Promise<number> {
    const result = await db.client()
      .from('mon_revenue_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_free', false);
    return result.count ?? 0;
  },

  async getRevenueSum(from: Date, to: Date, service?: string): Promise<number> {
    let q = db.client()
      .from('mon_revenue_events')
      .select('fee_amount')
      .eq('status', 'collected')
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString());
    if (service) q = q.eq('service', service);
    const { data, error } = await q;
    if (error) return 0;
    return ((data ?? []) as Record<string, unknown>[])
      .reduce((sum, r) => sum + (r['fee_amount'] as number ?? 0), 0);
  },
};

function _zero(service: MonetizationService, amount: number, currency: string, freeReason: string): FeeCalculation {
  return { service, originalAmount: amount, feeAmount: 0, feePercent: 0, totalAmount: amount, currency, isFree: true, freeReason };
}

function _selectRule(
  rules: FeeRule[],
  ctx: { country?: string; city?: string; userType?: string; txCount: number }
): FeeRule | null {
  const matching = rules.filter(r => {
    if (r.country  && r.country  !== ctx.country)   return false;
    if (r.city     && r.city     !== ctx.city)       return false;
    if (r.userType && r.userType !== ctx.userType)   return false;
    if (r.volumeMin !== undefined && ctx.txCount < r.volumeMin) return false;
    if (r.volumeMax !== undefined && ctx.txCount > r.volumeMax) return false;
    return true;
  });
  return matching[0] ?? null;
}