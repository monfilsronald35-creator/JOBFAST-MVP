import { EnterpriseRepository } from '../repositories/EnterpriseRepository.js';
import { AuditLogService }       from './AuditLogService.js';
import type { SecuritySettings, TrustedDevice } from '../types/enterprise.types.js';
import { db }                    from '../../../core/database/SupabaseClient.js';

export const SecurityService = {
  async getSettings(orgId: string): Promise<SecuritySettings> {
    const existing = await EnterpriseRepository.getSecuritySettings(orgId);
    return existing ?? {
      orgId, ssoEnabled: false, mfaRequired: false, mfaMethod: 'totp',
      ipWhitelist: [], sessionTimeoutMin: 480, maxLoginAttempts: 5,
      requireStrongPw: true, updatedAt: new Date().toISOString(),
    };
  },

  async updateSettings(orgId: string, userId: string, patch: Partial<SecuritySettings>): Promise<void> {
    const current = await SecurityService.getSettings(orgId);
    const merged: SecuritySettings = { ...current, ...patch, orgId, updatedAt: new Date().toISOString() };
    await EnterpriseRepository.upsertSecuritySettings(merged);
    await AuditLogService.log({
      orgId, userId, action: 'security.settings_updated', entity: 'security', entityId: orgId,
      after: patch as Record<string, unknown>,
    });
  },

  async registerDevice(userId: string, orgId: string, input: {
    deviceId: string; deviceName: string; userAgent: string; ip: string;
  }): Promise<TrustedDevice> {
    const device: Omit<TrustedDevice, 'id'> = {
      userId, orgId,
      deviceId:   input.deviceId,
      deviceName: input.deviceName,
      userAgent:  input.userAgent,
      ip:         input.ip,
      trustedAt:  new Date().toISOString(),
      expiresAt:  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const { data, error } = await db.client().from('ent_trusted_devices').upsert({
      user_id: device.userId, org_id: device.orgId, device_id: device.deviceId,
      device_name: device.deviceName, user_agent: device.userAgent, ip: device.ip,
      trusted_at: device.trustedAt, expires_at: device.expiresAt,
    }, { onConflict: 'user_id,org_id,device_id' }).select().single();
    if (error) throw error;
    const r = data as Record<string, unknown>;
    return { ...device, id: String(r['id'] ?? '') };
  },

  async isTrustedDevice(userId: string, orgId: string, deviceId: string): Promise<boolean> {
    const { data } = await db.client()
      .from('ent_trusted_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .eq('device_id', deviceId)
      .gt('expires_at', new Date().toISOString())
      .single();
    return !!data;
  },

  async listDevices(userId: string, orgId: string): Promise<TrustedDevice[]> {
    const { data } = await db.client()
      .from('ent_trusted_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .gt('expires_at', new Date().toISOString());
    return (data ?? []).map(r => {
      const row = r as Record<string, unknown>;
      return {
        id:         String(row['id'] ?? ''),
        userId, orgId,
        deviceId:   String(row['device_id'] ?? ''),
        deviceName: String(row['device_name'] ?? ''),
        userAgent:  String(row['user_agent'] ?? ''),
        ip:         String(row['ip'] ?? ''),
        trustedAt:  String(row['trusted_at'] ?? ''),
        expiresAt:  String(row['expires_at'] ?? ''),
      };
    });
  },

  async revokeDevice(deviceId: string, userId: string, orgId: string): Promise<void> {
    await db.client().from('ent_trusted_devices')
      .delete().eq('device_id', deviceId).eq('user_id', userId).eq('org_id', orgId);
  },

  isIpAllowed(ip: string, whitelist: string[]): boolean {
    if (whitelist.length === 0) return true;
    return whitelist.includes(ip);
  },
};