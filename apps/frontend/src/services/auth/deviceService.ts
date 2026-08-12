import { supabase } from '../../lib/supabase';
import type {
  UserDevice,
  DeviceType,
} from '../../types/identity';

type UserDeviceRow = {
  id: string;
  user_id: string;

  device_identifier: string;
  device_fingerprint: string | null;
  push_token: string | null;

  device_name: string | null;
  manufacturer: string | null;
  model: string | null;
  os_version: string | null;
  platform_version: string | null;
  app_version: string | null;

  device_type: DeviceType;

  locale: string | null;
  timezone: string | null;
  ip_address: string | null;

  is_active: boolean;

  last_used_at: string;
  created_at: string;
  updated_at: string;
};

function mapUserDevice(row: UserDeviceRow): UserDevice {
  return {
    id: row.id,
    userId: row.user_id,

    deviceIdentifier: row.device_identifier,
    deviceFingerprint: row.device_fingerprint,
    pushToken: row.push_token,

    deviceName: row.device_name,
    manufacturer: row.manufacturer,
    model: row.model,
    osVersion: row.os_version,
    platformVersion: row.platform_version,
    appVersion: row.app_version,

    deviceType: row.device_type,

    locale: row.locale,
    timezone: row.timezone,
    ipAddress: row.ip_address,

    isActive: row.is_active,

    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getMyDevices(): Promise<UserDevice[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('User is not authenticated.');
  }

  const { data, error } = await supabase
    .from('user_devices')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('last_used_at', {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Failed to load devices: ${error.message}`
    );
  }

  return (data ?? []).map(mapUserDevice);
}

export async function revokeMyDevice(
  deviceId: string
): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('User is not authenticated.');
  }

  const { error } = await supabase
    .from('user_devices')
    .update({
      is_active: false,
    })
    .eq('id', deviceId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(
      `Failed to revoke device: ${error.message}`
    );
  }
}
