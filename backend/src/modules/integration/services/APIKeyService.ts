import { randomBytes, createHash } from 'crypto';
import { db } from '../../../core/database/SupabaseClient.js';
import type { APIKey, APIKeyData, IntegrationScope } from '../types/integration.types.js';

export const APIKeyService = {
  async generate(actorId: string, partnerId: string, params: {
    name: string;
    scopes: IntegrationScope[];
    rateLimitPerMin?: number;
    rateLimitPerDay?: number;
    expiresAt?: Date;
    sandbox?: boolean;
  }): Promise<{ key: APIKey; rawKey: string }> {
    const prefix  = params.sandbox ? 'jf_test' : 'jf_live';
    const rawKey  = `${prefix}_${randomBytes(24).toString('hex')}`;
    const keyHash = _hash(rawKey);
    const keyPrefix = rawKey.slice(0, 12) + '...';

    const payload: Record<string, unknown> = {
      partner_id:         partnerId,
      key_hash:           keyHash,
      key_prefix:         keyPrefix,
      name:               params.name,
      scopes:             params.scopes,
      rate_limit_per_min: params.rateLimitPerMin ?? 60,
      rate_limit_per_day: params.rateLimitPerDay ?? 10_000,
      active:             true,
      created_by:         actorId,
    };
    if (params.expiresAt) payload['expires_at'] = params.expiresAt.toISOString();

    const { data, error } = await db.client()
      .from('int_api_keys')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;

    return { key: _map(data as Record<string, unknown>), rawKey };
  },

  async validate(rawKey: string): Promise<APIKeyData | null> {
    const keyHash = _hash(rawKey);
    const { data } = await db.client()
      .from('int_api_keys')
      .select('id, partner_id, scopes, rate_limit_per_min, rate_limit_per_day, expires_at')
      .eq('key_hash', keyHash)
      .eq('active', true)
      .single();

    if (!data) return null;

    const row = data as Record<string, unknown>;
    if (row['expires_at'] && new Date(row['expires_at'] as string) < new Date()) return null;

    // Update last_used_at (fire-and-forget)
    db.client()
      .from('int_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', row['id'] as string)
      .then(() => {}).catch(() => {});

    return {
      keyId:           row['id']                 as string,
      partnerId:       row['partner_id']          as string,
      scopes:          (row['scopes']             as IntegrationScope[]) ?? [],
      rateLimitPerMin: (row['rate_limit_per_min'] as number) ?? 60,
      rateLimitPerDay: (row['rate_limit_per_day'] as number) ?? 10_000,
    };
  },

  async listForPartner(partnerId: string): Promise<APIKey[]> {
    const { data, error } = await db.client()
      .from('int_api_keys')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(_map);
  },

  async revoke(id: string): Promise<void> {
    const { error } = await db.client()
      .from('int_api_keys')
      .update({ active: false })
      .eq('id', id);
    if (error) throw error;
  },
};

function _hash(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

function _map(row: Record<string, unknown>): APIKey {
  const k: APIKey = {
    id:              row['id']                  as string,
    partnerId:       row['partner_id']           as string,
    keyPrefix:       row['key_prefix']           as string,
    name:            row['name']                 as string,
    scopes:          (row['scopes']              as IntegrationScope[]) ?? [],
    rateLimitPerMin: (row['rate_limit_per_min']  as number) ?? 60,
    rateLimitPerDay: (row['rate_limit_per_day']  as number) ?? 10_000,
    active:          row['active']               as boolean,
    createdAt:       new Date(row['created_at']  as string).getTime(),
  };
  if (row['expires_at'])   k.expiresAt  = new Date(row['expires_at']   as string).getTime();
  if (row['last_used_at']) k.lastUsedAt = new Date(row['last_used_at'] as string).getTime();
  return k;
}
