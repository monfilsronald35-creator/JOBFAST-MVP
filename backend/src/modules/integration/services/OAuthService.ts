import { randomBytes, createHash } from 'crypto';
import { db } from '../../../core/database/SupabaseClient.js';
import type { OAuthClient, IntegrationScope } from '../types/integration.types.js';

const CODE_TTL_MS    = 10 * 60 * 1000; // 10 minutes
const ACCESS_TTL_MS  = 60 * 60 * 1000; // 1 hour

export const OAuthService = {
  async registerClient(params: {
    name: string;
    redirectUris: string[];
    allowedScopes: IntegrationScope[];
    partnerId?: string;
    grantTypes?: string[];
  }): Promise<{ client: OAuthClient; secret: string }> {
    const clientId     = `jf_client_${randomBytes(16).toString('hex')}`;
    const secret       = randomBytes(32).toString('hex');
    const secretHash   = _hash(secret);

    const payload: Record<string, unknown> = {
      client_id:          clientId,
      client_secret_hash: secretHash,
      name:               params.name,
      redirect_uris:      params.redirectUris,
      allowed_scopes:     params.allowedScopes,
      grant_types:        params.grantTypes ?? ['authorization_code'],
      active:             true,
    };
    if (params.partnerId) payload['partner_id'] = params.partnerId;

    const { data, error } = await db.client()
      .from('int_oauth_clients')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;

    return { client: _mapClient(data as Record<string, unknown>), secret };
  },

  async getClient(clientId: string): Promise<OAuthClient | null> {
    const { data } = await db.client()
      .from('int_oauth_clients')
      .select('*')
      .eq('client_id', clientId)
      .eq('active', true)
      .single();
    return data ? _mapClient(data as Record<string, unknown>) : null;
  },

  async issueCode(params: {
    clientId:    string;
    userId:      string;
    scopes:      IntegrationScope[];
    redirectUri: string;
  }): Promise<string> {
    const client = await OAuthService.getClient(params.clientId);
    if (!client) throw new Error('Invalid client_id');
    if (!client.redirectUris.includes(params.redirectUri))
      throw new Error('redirect_uri not registered');

    const code = randomBytes(32).toString('hex');
    const { error } = await db.client().from('int_oauth_codes').insert({
      code,
      client_id:   params.clientId,
      user_id:     params.userId,
      scopes:      params.scopes,
      redirect_uri: params.redirectUri,
      expires_at:  new Date(Date.now() + CODE_TTL_MS).toISOString(),
      used:        false,
    });
    if (error) throw error;
    return code;
  },

  async exchangeCode(params: {
    code:        string;
    clientId:    string;
    clientSecret: string;
    redirectUri: string;
  }): Promise<{ accessToken: string; scopes: IntegrationScope[]; expiresIn: number } | null> {
    const client = await OAuthService.getClient(params.clientId);
    if (!client) return null;

    const { data: clientData } = await db.client()
      .from('int_oauth_clients')
      .select('client_secret_hash')
      .eq('client_id', params.clientId)
      .single();
    if (!clientData) return null;

    const row = clientData as Record<string, unknown>;
    if (row['client_secret_hash'] !== _hash(params.clientSecret)) return null;

    const { data: codeData } = await db.client()
      .from('int_oauth_codes')
      .select('*')
      .eq('code', params.code)
      .eq('client_id', params.clientId)
      .eq('used', false)
      .single();
    if (!codeData) return null;

    const codeRow = codeData as Record<string, unknown>;
    if (new Date(codeRow['expires_at'] as string) < new Date()) return null;
    if (codeRow['redirect_uri'] !== params.redirectUri) return null;

    // Mark code as used (one-time)
    await db.client().from('int_oauth_codes').update({ used: true }).eq('code', params.code);

    const accessToken = `jf_token_${randomBytes(32).toString('hex')}`;
    const scopes      = (codeRow['scopes'] as IntegrationScope[]) ?? [];

    return { accessToken, scopes, expiresIn: ACCESS_TTL_MS / 1000 };
  },

  async listClients(partnerId?: string): Promise<OAuthClient[]> {
    let q = db.client().from('int_oauth_clients').select('*').order('created_at', { ascending: false });
    if (partnerId) q = q.eq('partner_id', partnerId);
    const { data, error } = await q;
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(_mapClient);
  },

  async deactivateClient(id: string): Promise<void> {
    const { error } = await db.client().from('int_oauth_clients').update({ active: false }).eq('id', id);
    if (error) throw error;
  },
};

function _hash(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

function _mapClient(row: Record<string, unknown>): OAuthClient {
  const c: OAuthClient = {
    id:            row['id']             as string,
    clientId:      row['client_id']      as string,
    name:          row['name']           as string,
    redirectUris:  (row['redirect_uris'] as string[])         ?? [],
    allowedScopes: (row['allowed_scopes'] as IntegrationScope[]) ?? [],
    grantTypes:    (row['grant_types']   as string[])         ?? ['authorization_code'],
    active:        row['active']         as boolean,
    createdAt:     new Date(row['created_at'] as string).getTime(),
  };
  if (row['partner_id']) c.partnerId = row['partner_id'] as string;
  return c;
}
