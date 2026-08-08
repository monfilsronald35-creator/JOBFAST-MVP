import { db } from '../../../core/database/SupabaseClient.js';
import type { MonetizationConfig, FeeRule, MonetizationService } from '../types/monetization.types.js';

interface Cache {
  config: MonetizationConfig;
  services: Record<string, boolean>;
  rules: FeeRule[];
}

let _cache: Cache | null = null;
let _cacheExp = 0;
const TTL = 5 * 60 * 1000;

export const MonetizationConfigService = {
  async getConfig(): Promise<MonetizationConfig> {
    await _load();
    return _cache!.config;
  },

  async getServiceConfigs(): Promise<Record<string, boolean>> {
    await _load();
    return _cache!.services;
  },

  async isEnabled(service?: MonetizationService): Promise<boolean> {
    await _load();
    if (!_cache!.config.globalEnabled) return false;
    if (service) return _cache!.services[service] ?? false;
    return true;
  },

  async setGlobalEnabled(actorId: string, enabled: boolean): Promise<void> {
    const { error } = await db.client()
      .from('mon_config')
      .update({ global_enabled: enabled, updated_at: new Date().toISOString(), updated_by: actorId })
      .eq('id', 'singleton');
    if (error) throw error;
    _invalidate();
  },

  async setServiceEnabled(actorId: string, service: MonetizationService, enabled: boolean): Promise<void> {
    const { error } = await db.client()
      .from('mon_service_config')
      .upsert(
        { service, enabled, updated_at: new Date().toISOString(), updated_by: actorId },
        { onConflict: 'service' }
      );
    if (error) throw error;
    _invalidate();
  },

  async getFeeRules(service?: MonetizationService): Promise<FeeRule[]> {
    await _load();
    const rules = _cache!.rules;
    return service ? rules.filter(r => r.service === service) : rules;
  },

  async getAllFeeRules(): Promise<FeeRule[]> {
    const { data, error } = await db.client()
      .from('mon_fee_rules')
      .select('*')
      .order('priority', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(_mapRule);
  },

  async upsertFeeRule(
    actorId: string,
    rule: Omit<FeeRule, 'id' | 'createdAt'> & { id?: string }
  ): Promise<FeeRule> {
    const payload: Record<string, unknown> = {
      service:    rule.service,
      priority:   rule.priority,
      active:     rule.active,
      updated_at: new Date().toISOString(),
      created_by: actorId,
    };
    if (rule.id)                       payload['id']           = rule.id;
    if (rule.country)                  payload['country']      = rule.country;
    if (rule.city)                     payload['city']         = rule.city;
    if (rule.userType)                 payload['user_type']    = rule.userType;
    if (rule.volumeMin !== undefined)  payload['volume_min']   = rule.volumeMin;
    if (rule.volumeMax !== undefined)  payload['volume_max']   = rule.volumeMax;
    if (rule.ratePercent !== undefined)payload['rate_percent'] = rule.ratePercent;
    if (rule.fixedAmount !== undefined)payload['fixed_amount'] = rule.fixedAmount;
    if (rule.currency)                 payload['currency']     = rule.currency;
    if (rule.label)                    payload['label']        = rule.label;

    const { data, error } = await db.client()
      .from('mon_fee_rules')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    _invalidate();
    return _mapRule(data as Record<string, unknown>);
  },

  async deleteFeeRule(ruleId: string): Promise<void> {
    const { error } = await db.client().from('mon_fee_rules').delete().eq('id', ruleId);
    if (error) throw error;
    _invalidate();
  },

  invalidateCache(): void { _invalidate(); },
};

function _invalidate() { _cache = null; _cacheExp = 0; }

async function _load(): Promise<void> {
  if (_cache && Date.now() < _cacheExp) return;

  const [cfgRes, svcRes, rulesRes] = await Promise.all([
    db.client().from('mon_config').select('*').eq('id', 'singleton').single(),
    db.client().from('mon_service_config').select('*'),
    db.client().from('mon_fee_rules').select('*').eq('active', true).order('priority', { ascending: false }),
  ]);

  const cfg = cfgRes.data as Record<string, unknown> | null;
  const services: Record<string, boolean> = {};
  for (const row of ((svcRes.data ?? []) as Record<string, unknown>[])) {
    services[row['service'] as string] = row['enabled'] as boolean;
  }

  _cache = {
    config: {
      globalEnabled: (cfg?.['global_enabled'] as boolean) ?? false,
      updatedAt:     cfg?.['updated_at'] ? new Date(cfg['updated_at'] as string).getTime() : 0,
      updatedBy:     (cfg?.['updated_by'] as string | null) ?? null,
    },
    services,
    rules: ((rulesRes.data ?? []) as Record<string, unknown>[]).map(_mapRule),
  };
  _cacheExp = Date.now() + TTL;
}

function _mapRule(row: Record<string, unknown>): FeeRule {
  const rule: FeeRule = {
    id:        row['id'] as string,
    service:   row['service'] as MonetizationService,
    priority:  row['priority'] as number,
    active:    row['active'] as boolean,
    createdAt: new Date(row['created_at'] as string).getTime(),
  };
  if (row['country'])                                          rule.country     = row['country'] as string;
  if (row['city'])                                             rule.city        = row['city'] as string;
  if (row['user_type'])                                        rule.userType    = row['user_type'] as string;
  if (row['volume_min'] !== null && row['volume_min'] !== undefined) rule.volumeMin = row['volume_min'] as number;
  if (row['volume_max'] !== null && row['volume_max'] !== undefined) rule.volumeMax = row['volume_max'] as number;
  if (row['rate_percent'] !== null && row['rate_percent'] !== undefined)
    rule.ratePercent = parseFloat(String(row['rate_percent']));
  if (row['fixed_amount'] !== null && row['fixed_amount'] !== undefined)
    rule.fixedAmount = row['fixed_amount'] as number;
  if (row['currency'])                                         rule.currency    = row['currency'] as string;
  if (row['label'])                                            rule.label       = row['label'] as string;
  return rule;
}