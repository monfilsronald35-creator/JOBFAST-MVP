import { db } from '../../../core/database/SupabaseClient.js';
import type { FreeTierStrategy, FreeTierStrategyType, MonetizationService } from '../types/monetization.types.js';

let _cache: FreeTierStrategy[] | null = null;
let _cacheExp = 0;

export const FreeTierEngine = {
  async isInFreeTier(
    userId: string,
    service: MonetizationService,
    userType?: string
  ): Promise<{ isFree: boolean; reason: string }> {
    const strategies = await FreeTierEngine.getActiveStrategies();

    for (const s of strategies) {
      if (s.service && s.service !== service) continue;

      if (s.strategyType === 'user_type' && s.userTypes && userType) {
        if (s.userTypes.includes(userType)) {
          return { isFree: true, reason: `free_user_type:${userType}` };
        }
      }

      if (s.strategyType === 'days' && s.value !== undefined) {
        const regDate = await _getRegistrationDate(userId);
        if (regDate) {
          const daysSince = (Date.now() - regDate.getTime()) / 86_400_000;
          if (daysSince <= s.value) {
            return { isFree: true, reason: `free_launch_period:${Math.ceil(s.value - daysSince)}d_left` };
          }
        }
      }

      if (s.strategyType === 'transactions' && s.value !== undefined) {
        const result = await db.client()
          .from('mon_revenue_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_free', false);
        if ((result.count ?? 0) < s.value) {
          return { isFree: true, reason: `free_first_${s.value}_transactions` };
        }
      }

      if (s.strategyType === 'month') {
        const regDate = await _getRegistrationDate(userId);
        if (regDate) {
          const monthsSince = (Date.now() - regDate.getTime()) / (30 * 86_400_000);
          if (monthsSince < 1) return { isFree: true, reason: 'free_first_month' };
        }
      }

      if (s.strategyType === 'year') {
        const regDate = await _getRegistrationDate(userId);
        if (regDate) {
          const daysSince = (Date.now() - regDate.getTime()) / 86_400_000;
          if (daysSince < 365) return { isFree: true, reason: 'free_first_year' };
        }
      }
    }

    return { isFree: false, reason: '' };
  },

  async getActiveStrategies(): Promise<FreeTierStrategy[]> {
    if (_cache && Date.now() < _cacheExp) return _cache;
    const { data, error } = await db.client()
      .from('mon_free_tier_strategies')
      .select('*')
      .eq('active', true);
    if (error) return [];
    _cache = ((data ?? []) as Record<string, unknown>[]).map(_mapStrategy);
    _cacheExp = Date.now() + 5 * 60 * 1000;
    return _cache;
  },

  async getAllStrategies(): Promise<FreeTierStrategy[]> {
    const { data, error } = await db.client()
      .from('mon_free_tier_strategies')
      .select('*')
      .order('created_at');
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(_mapStrategy);
  },

  async upsertStrategy(
    actorId: string,
    s: Omit<FreeTierStrategy, 'id' | 'createdAt'> & { id?: string }
  ): Promise<FreeTierStrategy> {
    const payload: Record<string, unknown> = {
      name:          s.name,
      strategy_type: s.strategyType,
      active:        s.active,
      created_by:    actorId,
    };
    if (s.id)                   payload['id']         = s.id;
    if (s.value !== undefined)  payload['value']      = s.value;
    if (s.currency)             payload['currency']   = s.currency;
    if (s.userTypes)            payload['user_types'] = s.userTypes;
    if (s.service)              payload['service']    = s.service;

    const { data, error } = await db.client()
      .from('mon_free_tier_strategies')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    _cache = null;
    return _mapStrategy(data as Record<string, unknown>);
  },

  async deleteStrategy(id: string): Promise<void> {
    const { error } = await db.client().from('mon_free_tier_strategies').delete().eq('id', id);
    if (error) throw error;
    _cache = null;
  },
};

async function _getRegistrationDate(userId: string): Promise<Date | null> {
  const { data } = await db.client()
    .from('profiles')
    .select('created_at')
    .eq('id', userId)
    .single();
  if (!data) return null;
  return new Date((data as Record<string, unknown>)['created_at'] as string);
}

function _mapStrategy(row: Record<string, unknown>): FreeTierStrategy {
  const s: FreeTierStrategy = {
    id:           row['id'] as string,
    name:         row['name'] as string,
    strategyType: row['strategy_type'] as FreeTierStrategyType,
    active:       row['active'] as boolean,
    createdAt:    new Date(row['created_at'] as string).getTime(),
  };
  if (row['value'] !== null && row['value'] !== undefined) s.value = parseFloat(String(row['value']));
  if (row['currency'])    s.currency  = row['currency'] as string;
  if (row['user_types'])  s.userTypes = row['user_types'] as string[];
  if (row['service'])     s.service   = row['service'] as string;
  return s;
}