import { db } from '../../../core/database/SupabaseClient.js';
import { AppError } from '../../../core/errors/AppError.js';
import type { SessionRecord } from '../types/identity.types.js';
import { AuthMethod } from '../types/identity.types.js';

interface CreateSessionInput {
  userId:       string;
  deviceId?:    string;
  sessionToken: string;
  ipAddress?:   string;
  countryCode?: string;
  city?:        string;
  browser?:     string;
  os?:          string;
  appVersion?:  string;
  loginMethod:  AuthMethod;
  riskScore:    number;
  riskFlags:    string[];
  mfaVerified:  boolean;
  expiresAt:    Date;
}

function toRecord(row: Record<string, unknown>): SessionRecord {
  return {
    id:           row['id'] as string,
    userId:       row['user_id'] as string,
    deviceId:     row['device_id'] as string | undefined,
    sessionToken: row['session_token'] as string,
    ipAddress:    row['ip_address'] as string | undefined,
    countryCode:  row['country_code'] as string | undefined,
    city:         row['city'] as string | undefined,
    browser:      row['browser'] as string | undefined,
    os:           row['os'] as string | undefined,
    appVersion:   row['app_version'] as string | undefined,
    loginMethod:  row['login_method'] as AuthMethod,
    riskScore:    row['risk_score'] as number,
    riskFlags:    (row['risk_flags'] as string[]) ?? [],
    isActive:     row['is_active'] as boolean,
    mfaVerified:  row['mfa_verified'] as boolean,
    expiresAt:    row['expires_at'] as string,
    lastActive:   row['last_active'] as string,
    createdAt:    row['created_at'] as string,
  };
}

export const SessionRepository = {
  async create(input: CreateSessionInput): Promise<SessionRecord> {
    return db.query(client =>
      client.from('identity_sessions').insert({
        user_id:       input.userId,
        device_id:     input.deviceId ?? null,
        session_token: input.sessionToken,
        ip_address:    input.ipAddress ?? null,
        country_code:  input.countryCode ?? null,
        city:          input.city ?? null,
        browser:       input.browser ?? null,
        os:            input.os ?? null,
        app_version:   input.appVersion ?? null,
        login_method:  input.loginMethod,
        risk_score:    input.riskScore,
        risk_flags:    input.riskFlags,
        mfa_verified:  input.mfaVerified,
        expires_at:    input.expiresAt.toISOString(),
        last_active:   new Date().toISOString(),
      }).select().single<Record<string, unknown>>()
    ).then(toRecord);
  },

  async findByToken(token: string): Promise<SessionRecord | null> {
    return db.queryNullable(client =>
      client.from('identity_sessions')
        .select()
        .eq('session_token', token)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single<Record<string, unknown>>()
    ).then(r => r ? toRecord(r) : null);
  },

  async findByUserId(userId: string): Promise<SessionRecord[]> {
    return db.query(client =>
      client.from('identity_sessions')
        .select()
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_active', { ascending: false })
    ).then((rows: Record<string, unknown>[]) => rows.map(toRecord));
  },

  async updateLastActive(sessionId: string): Promise<void> {
    await db.query(client =>
      client.from('identity_sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('id', sessionId)
        .select()
    );
  },

  async setMFAVerified(sessionId: string): Promise<void> {
    await db.query(client =>
      client.from('identity_sessions')
        .update({ mfa_verified: true })
        .eq('id', sessionId)
        .select()
    );
  },

  async revoke(sessionId: string): Promise<void> {
    await db.query(client =>
      client.from('identity_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)
        .select()
    );
  },

  async revokeAll(userId: string): Promise<number> {
    const result = await db.query(client =>
      client.from('identity_sessions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true)
        .select()
    );
    return (result as unknown[]).length;
  },

  async revokeAllExcept(userId: string, sessionId: string): Promise<number> {
    const result = await db.query(client =>
      client.from('identity_sessions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true)
        .neq('id', sessionId)
        .select()
    );
    return (result as unknown[]).length;
  },
};
