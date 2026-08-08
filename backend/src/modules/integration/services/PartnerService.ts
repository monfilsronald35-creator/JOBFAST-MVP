import { db } from '../../../core/database/SupabaseClient.js';
import type { Partner, PartnerType, PartnerTier, IntegrationScope } from '../types/integration.types.js';

export const PartnerService = {
  async create(actorId: string, params: {
    name: string;
    type: PartnerType;
    tier?: PartnerTier;
    country?: string;
    contactEmail?: string;
    website?: string;
    allowedScopes?: IntegrationScope[];
    metadata?: Record<string, unknown>;
  }): Promise<Partner> {
    const payload: Record<string, unknown> = {
      name:           params.name,
      type:           params.type,
      tier:           params.tier ?? 'standard',
      status:         'active',
      allowed_scopes: params.allowedScopes ?? [],
      created_by:     actorId,
    };
    if (params.country)      payload['country']       = params.country;
    if (params.contactEmail) payload['contact_email'] = params.contactEmail;
    if (params.website)      payload['website']       = params.website;
    if (params.metadata)     payload['metadata']      = params.metadata;

    const { data, error } = await db.client()
      .from('int_partners')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return _map(data as Record<string, unknown>);
  },

  async get(id: string): Promise<Partner | null> {
    const { data } = await db.client().from('int_partners').select('*').eq('id', id).single();
    return data ? _map(data as Record<string, unknown>) : null;
  },

  async list(params?: { type?: string; status?: string; limit?: number }): Promise<Partner[]> {
    let q = db.client().from('int_partners').select('*').order('created_at', { ascending: false });
    if (params?.type)   q = q.eq('type',   params.type);
    if (params?.status) q = q.eq('status', params.status);
    if (params?.limit)  q = q.limit(params.limit);
    const { data, error } = await q;
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(_map);
  },

  async update(id: string, updates: Partial<Pick<Partner, 'name' | 'type' | 'tier' | 'status' | 'country' | 'contactEmail' | 'website' | 'allowedScopes' | 'webhookUrl' | 'metadata'>>): Promise<Partner> {
    const payload: Record<string, unknown> = {};
    if (updates.name)          payload['name']           = updates.name;
    if (updates.type)          payload['type']           = updates.type;
    if (updates.tier)          payload['tier']           = updates.tier;
    if (updates.status)        payload['status']         = updates.status;
    if (updates.country)       payload['country']        = updates.country;
    if (updates.contactEmail)  payload['contact_email']  = updates.contactEmail;
    if (updates.website)       payload['website']        = updates.website;
    if (updates.allowedScopes) payload['allowed_scopes'] = updates.allowedScopes;
    if (updates.webhookUrl)    payload['webhook_url']    = updates.webhookUrl;
    if (updates.metadata)      payload['metadata']       = updates.metadata;

    const { data, error } = await db.client()
      .from('int_partners').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return _map(data as Record<string, unknown>);
  },

  async suspend(id: string): Promise<void> {
    const { error } = await db.client().from('int_partners').update({ status: 'suspended' }).eq('id', id);
    if (error) throw error;
  },
};

function _map(row: Record<string, unknown>): Partner {
  const p: Partner = {
    id:            row['id']             as string,
    name:          row['name']           as string,
    type:          row['type']           as PartnerType,
    tier:          row['tier']           as PartnerTier,
    status:        row['status']         as Partner['status'],
    allowedScopes: (row['allowed_scopes'] as IntegrationScope[]) ?? [],
    createdAt:     new Date(row['created_at'] as string).getTime(),
  };
  if (row['country'])       p.country      = row['country']       as string;
  if (row['contact_email']) p.contactEmail = row['contact_email'] as string;
  if (row['website'])       p.website      = row['website']       as string;
  if (row['webhook_url'])   p.webhookUrl   = row['webhook_url']   as string;
  if (row['metadata'])      p.metadata     = row['metadata']      as Record<string, unknown>;
  return p;
}
