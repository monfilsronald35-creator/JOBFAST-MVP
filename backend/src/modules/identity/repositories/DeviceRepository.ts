import { db } from '../../../core/database/SupabaseClient.js';
import type { DeviceRecord } from '../types/identity.types.js';

interface UpsertDeviceInput {
  userId:      string;
  deviceId:    string;
  deviceName?: string;
  deviceType?: string;
  browser?:    string;
  os?:         string;
  fingerprint?:string;
  lastIp?:     string;
}

function toRecord(row: Record<string, unknown>): DeviceRecord {
  return {
    id:           row['id'] as string,
    userId:       row['user_id'] as string,
    deviceId:     row['device_id'] as string,
    deviceName:   row['device_name'] as string | undefined,
    deviceType:   row['device_type'] as string | undefined,
    browser:      row['browser'] as string | undefined,
    os:           row['os'] as string | undefined,
    isTrusted:    row['is_trusted'] as boolean,
    trustExpires: row['trust_expires'] as string | undefined,
    fingerprint:  row['fingerprint'] as string | undefined,
    lastSeen:     row['last_seen'] as string,
    lastIp:       row['last_ip'] as string | undefined,
    createdAt:    row['created_at'] as string,
  };
}

export const DeviceRepository = {
  async upsert(input: UpsertDeviceInput): Promise<DeviceRecord> {
    return db.query(client =>
      client.from('identity_devices').upsert({
        user_id:     input.userId,
        device_id:   input.deviceId,
        device_name: input.deviceName ?? null,
        device_type: input.deviceType ?? null,
        browser:     input.browser ?? null,
        os:          input.os ?? null,
        fingerprint: input.fingerprint ?? null,
        last_seen:   new Date().toISOString(),
        last_ip:     input.lastIp ?? null,
      }, { onConflict: 'user_id,device_id' }).select().single<Record<string, unknown>>()
    ).then(toRecord);
  },

  async findByUserAndDevice(userId: string, deviceId: string): Promise<DeviceRecord | null> {
    return db.queryNullable(client =>
      client.from('identity_devices')
        .select()
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .single<Record<string, unknown>>()
    ).then(r => r ? toRecord(r) : null);
  },

  async findByUserId(userId: string): Promise<DeviceRecord[]> {
    return db.query(client =>
      client.from('identity_devices')
        .select()
        .eq('user_id', userId)
        .order('last_seen', { ascending: false })
    ).then((rows: Record<string, unknown>[]) => rows.map(toRecord));
  },

  async trust(id: string, untilDays = 30): Promise<void> {
    const expires = new Date();
    expires.setDate(expires.getDate() + untilDays);
    await db.query(client =>
      client.from('identity_devices')
        .update({ is_trusted: true, trust_expires: expires.toISOString() })
        .eq('id', id)
        .select()
    );
  },

  async revokeTrust(id: string): Promise<void> {
    await db.query(client =>
      client.from('identity_devices')
        .update({ is_trusted: false, trust_expires: null })
        .eq('id', id)
        .select()
    );
  },

  async rename(id: string, name: string): Promise<void> {
    await db.query(client =>
      client.from('identity_devices')
        .update({ device_name: name })
        .eq('id', id)
        .select()
    );
  },

  async delete(id: string, userId: string): Promise<void> {
    await db.query(client =>
      client.from('identity_devices')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select()
    );
  },
};
