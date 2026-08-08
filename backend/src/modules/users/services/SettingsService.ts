import { db } from '../../../core/database/SupabaseClient.js';

export interface UserSettings {
  theme:           'light' | 'dark' | 'system';
  language:        string;
  timezone:        string;
  dateFormat:      string;
  currency:        string;
  notifications:   NotificationSettings;
  privacy:         PrivacySettings;
  accessibility:   AccessibilitySettings;
}

interface NotificationSettings {
  emailJobs:        boolean;
  emailPayments:    boolean;
  emailMarketing:   boolean;
  pushEnabled:      boolean;
  pushJobs:         boolean;
  pushMessages:     boolean;
  pushPayments:     boolean;
  smsEnabled:       boolean;
}

interface PrivacySettings {
  profilePublic:   boolean;
  showEmail:       boolean;
  showPhone:       boolean;
  showLocation:    boolean;
  allowMessaging:  'everyone' | 'connections' | 'none';
  dataSharing:     boolean;
}

interface AccessibilitySettings {
  fontSize:        'sm' | 'md' | 'lg' | 'xl';
  highContrast:    boolean;
  reduceMotion:    boolean;
  screenReader:    boolean;
}

const DEFAULTS: UserSettings = {
  theme:     'system',
  language:  'ht',
  timezone:  'America/Port-au-Prince',
  dateFormat: 'DD/MM/YYYY',
  currency:  'HTG',
  notifications: {
    emailJobs: true, emailPayments: true, emailMarketing: false,
    pushEnabled: true, pushJobs: true, pushMessages: true, pushPayments: true,
    smsEnabled: false,
  },
  privacy: {
    profilePublic: true, showEmail: false, showPhone: false, showLocation: true,
    allowMessaging: 'everyone', dataSharing: false,
  },
  accessibility: {
    fontSize: 'md', highContrast: false, reduceMotion: false, screenReader: false,
  },
};

export const SettingsService = {
  async getSettings(userId: string): Promise<UserSettings> {
    const { data } = await db.client()
      .from('profiles')
      .select('metadata')
      .eq('user_id', userId)
      .single();

    if (!data) return DEFAULTS;
    const meta     = (data as Record<string, unknown>)['metadata'] as Record<string, unknown> | null;
    const settings = (meta?.['settings'] as Partial<UserSettings>) ?? {};
    return _merge(DEFAULTS, settings);
  },

  async updateSettings(userId: string, patch: Partial<UserSettings>): Promise<UserSettings> {
    const current = await SettingsService.getSettings(userId);
    const merged  = _merge(current, patch);

    const { data: profileRow } = await db.client()
      .from('profiles')
      .select('metadata')
      .eq('user_id', userId)
      .single();

    const meta = ((profileRow as Record<string, unknown> | null)?.['metadata'] as Record<string, unknown>) ?? {};
    await db.client()
      .from('profiles')
      .update({ metadata: { ...meta, settings: merged } })
      .eq('user_id', userId);

    return merged;
  },

  async getSessions(userId: string): Promise<unknown[]> {
    const { data } = await db.client()
      .from('user_sessions')
      .select('id, device_name, ip_address, user_agent, created_at, last_active_at, is_current')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_active_at', { ascending: false })
      .limit(20);
    return (data ?? []) as unknown[];
  },

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const { error } = await db.client()
      .from('user_sessions')
      .update({ is_active: false })
      .eq('id', sessionId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async getDevices(userId: string): Promise<unknown[]> {
    const { data } = await db.client()
      .from('user_devices')
      .select('id, device_name, device_type, platform, last_seen_at, is_trusted, created_at')
      .eq('user_id', userId)
      .order('last_seen_at', { ascending: false })
      .limit(20);
    return (data ?? []) as unknown[];
  },

  async revokeDevice(userId: string, deviceId: string): Promise<void> {
    const { error } = await db.client()
      .from('user_devices')
      .update({ is_trusted: false })
      .eq('id', deviceId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async deleteAccount(userId: string): Promise<void> {
    await db.client().from('profiles').update({
      metadata: { deleted: true, deleted_at: new Date().toISOString() },
    }).eq('user_id', userId);
    await db.client().from('users').update({ status: 'deleted' }).eq('id', userId);
  },
};

function _merge<T extends object>(base: T, patch: Partial<T>): T {
  const result: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== null && v !== undefined && typeof v === 'object' && !Array.isArray(v)) {
      result[k] = _merge((base as Record<string, unknown>)[k] as object ?? {}, v as Partial<object>);
    } else if (v !== undefined) {
      result[k] = v;
    }
  }
  return result as T;
}
