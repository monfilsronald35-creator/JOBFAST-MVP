import { db } from '../../../core/database/SupabaseClient.js';
import { TypedEventBus } from '../../../core/events/TypedEventBus.js';
import type { DomainEvent } from '../../../core/events/DomainEvent.js';

export interface EmergencyConfig {
  active: boolean;
  paymentsDisabled: boolean;
  walletReadonly: boolean;
  marketplaceReadonly: boolean;
  aiDisabled: boolean;
  registrationBlocked: boolean;
  externalApiBlocked: boolean;
  reason?: string;
  activatedAt?: number;
  activatedBy?: string;
}

let _cache: EmergencyConfig | null = null;
let _cacheExp = 0;

export const EmergencyModeService = {
  async getStatus(): Promise<EmergencyConfig> {
    if (_cache && Date.now() < _cacheExp) return _cache;
    const { data } = await db.client()
      .from('adm_emergency_config')
      .select('*')
      .eq('id', 'singleton')
      .single();
    _cache = _map(data as Record<string, unknown> | null);
    _cacheExp = Date.now() + 10_000; // 10s cache — must be fresh
    return _cache;
  },

  async activate(actorId: string, options: Partial<Omit<EmergencyConfig, 'active' | 'activatedAt' | 'activatedBy'>>): Promise<EmergencyConfig> {
    const now = new Date().toISOString();
    const update: Record<string, unknown> = {
      active:               true,
      activated_at:         now,
      activated_by:         actorId,
      deactivated_at:       null,
      deactivated_by:       null,
    };
    if (options.paymentsDisabled   !== undefined) update['payments_disabled']    = options.paymentsDisabled;
    if (options.walletReadonly      !== undefined) update['wallet_readonly']       = options.walletReadonly;
    if (options.marketplaceReadonly !== undefined) update['marketplace_readonly']  = options.marketplaceReadonly;
    if (options.aiDisabled          !== undefined) update['ai_disabled']           = options.aiDisabled;
    if (options.registrationBlocked !== undefined) update['registration_blocked']  = options.registrationBlocked;
    if (options.externalApiBlocked  !== undefined) update['external_api_blocked']  = options.externalApiBlocked;
    if (options.reason)                            update['reason']                = options.reason;

    const { data, error } = await db.client()
      .from('adm_emergency_config')
      .update(update)
      .eq('id', 'singleton')
      .select()
      .single();
    if (error) throw error;

    _cache = null;

    TypedEventBus.publish({
      eventId:   crypto.randomUUID(),
      eventName: 'admin.emergency_activated',
      occurredAt: Date.now(),
      version:   1,
      actorId,
      options,
    } as unknown as DomainEvent);

    return _map(data as Record<string, unknown>);
  },

  async deactivate(actorId: string): Promise<EmergencyConfig> {
    const now = new Date().toISOString();
    const { data, error } = await db.client()
      .from('adm_emergency_config')
      .update({
        active:               false,
        payments_disabled:    false,
        wallet_readonly:      false,
        marketplace_readonly: false,
        ai_disabled:          false,
        registration_blocked: false,
        external_api_blocked: false,
        reason:               null,
        deactivated_at:       now,
        deactivated_by:       actorId,
      })
      .eq('id', 'singleton')
      .select()
      .single();
    if (error) throw error;

    _cache = null;

    TypedEventBus.publish({
      eventId:    crypto.randomUUID(),
      eventName:  'admin.emergency_deactivated',
      occurredAt: Date.now(),
      version:    1,
      actorId,
    } as unknown as DomainEvent);

    return _map(data as Record<string, unknown>);
  },

  invalidateCache(): void { _cache = null; _cacheExp = 0; },
};

function _map(row: Record<string, unknown> | null): EmergencyConfig {
  if (!row) return { active: false, paymentsDisabled: false, walletReadonly: false, marketplaceReadonly: false, aiDisabled: false, registrationBlocked: false, externalApiBlocked: false };
  const cfg: EmergencyConfig = {
    active:               (row['active']               as boolean) ?? false,
    paymentsDisabled:     (row['payments_disabled']    as boolean) ?? false,
    walletReadonly:       (row['wallet_readonly']       as boolean) ?? false,
    marketplaceReadonly:  (row['marketplace_readonly']  as boolean) ?? false,
    aiDisabled:           (row['ai_disabled']           as boolean) ?? false,
    registrationBlocked:  (row['registration_blocked']  as boolean) ?? false,
    externalApiBlocked:   (row['external_api_blocked']  as boolean) ?? false,
  };
  if (row['reason'])       cfg.reason      = row['reason']       as string;
  if (row['activated_at']) cfg.activatedAt = new Date(row['activated_at'] as string).getTime();
  if (row['activated_by']) cfg.activatedBy = row['activated_by'] as string;
  return cfg;
}
