import { createHash }       from 'crypto';
import { db }               from '../../../core/database/SupabaseClient.js';
import type { RiskScore }   from '../types/security.types.js';

export const DeviceIntelligence = {
  fingerprint(userAgent: string, acceptLanguage = '', timezone = ''): string {
    return createHash('sha256')
      .update(`${userAgent}|${acceptLanguage}|${timezone}`)
      .digest('hex')
      .slice(0, 32);
  },

  async getOrCreateDevice(userId: string, fingerprint: string, ua: string, browser: string, os: string): Promise<{ isTrusted: boolean; riskScore: RiskScore; isNew: boolean }> {
    const { data: existing } = await db.client()
      .from('sec_devices').select('is_trusted, risk_score').eq('user_id', userId).eq('device_fingerprint', fingerprint).single();

    if (existing) {
      const e = existing as Record<string, unknown>;
      // Update last_seen
      await db.client().from('sec_devices').update({ last_seen_at: new Date().toISOString() }).eq('user_id', userId).eq('device_fingerprint', fingerprint);
      return { isTrusted: Boolean(e['is_trusted']), riskScore: Number(e['risk_score']), isNew: false };
    }

    // New device — insert and flag as untrusted
    await db.client().from('sec_devices').insert({
      user_id: userId, device_fingerprint: fingerprint,
      user_agent: ua, browser, os,
      is_trusted: false, risk_score: 25,
    });
    return { isTrusted: false, riskScore: 25, isNew: true };
  },

  async trustDevice(userId: string, fingerprint: string): Promise<void> {
    await db.client().from('sec_devices').update({ is_trusted: true, risk_score: 0 }).eq('user_id', userId).eq('device_fingerprint', fingerprint);
  },

  async revokeDevice(userId: string, fingerprint: string): Promise<void> {
    await db.client().from('sec_devices').update({ is_trusted: false, risk_score: 80 }).eq('user_id', userId).eq('device_fingerprint', fingerprint);
  },

  async listUserDevices(userId: string) {
    const { data } = await db.client().from('sec_devices').select('device_fingerprint, browser, os, is_trusted, risk_score, first_seen_at, last_seen_at').eq('user_id', userId).order('last_seen_at', { ascending: false });
    return (data ?? []) as Record<string, unknown>[];
  },
};