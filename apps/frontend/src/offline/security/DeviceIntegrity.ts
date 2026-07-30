/**
 * DeviceIntegrity — Device fingerprint, secure device ID, integrity checks.
 * Fingerprint is deterministic per device, stored in localStorage.
 * Not a cryptographic proof — provides a stable device identity for sync de-duplication.
 */

const DEVICE_ID_KEY = 'jf_device_id';
const FP_KEY        = 'jf_device_fp';

export interface DeviceInfo {
  deviceId:       string;
  fingerprint:    string;
  platform:       string;
  screenRes:      string;
  language:       string;
  timezone:       string;
  cores:          number;
  memory:         number;
  touchPoints:    number;
  cookieEnabled:  boolean;
  doNotTrack:     boolean;
  createdAt:      number;
}

export interface IntegrityReport {
  deviceId:        string;
  fingerprintMatch: boolean;
  trustScore:      number;
  warnings:        string[];
}

// ─── Fingerprint components ───────────────────────────────────────────────────

function collectComponents(): Record<string, string> {
  return {
    platform:   navigator.platform        ?? '',
    ua:         navigator.userAgent       ?? '',
    language:   navigator.language        ?? '',
    languages:  navigator.languages?.join(',') ?? '',
    timezone:   Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen:     `${screen.width}x${screen.height}x${screen.colorDepth}`,
    dpr:        String(devicePixelRatio ?? 1),
    cores:      String(navigator.hardwareConcurrency ?? 0),
    touch:      String(navigator.maxTouchPoints ?? 0),
    cookie:     String(navigator.cookieEnabled),
  };
}

async function hashComponents(components: Record<string, string>): Promise<string> {
  const text = Object.entries(components).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('|');
  try {
    const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    const arr  = Array.from(new Uint8Array(buf));
    return arr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  } catch {
    let h = 5381;
    for (let i = 0; i < text.length; i++) h = ((h << 5) + h) ^ text.charCodeAt(i);
    return Math.abs(h).toString(16).padStart(8, '0');
  }
}

// ─── DeviceIntegrity ─────────────────────────────────────────────────────────

export const DeviceIntegrity = {
  async getOrCreateDeviceId(): Promise<string> {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  },

  async getFingerprint(): Promise<string> {
    const cached = sessionStorage.getItem(FP_KEY);
    if (cached) return cached;
    const components = collectComponents();
    const fp = await hashComponents(components);
    sessionStorage.setItem(FP_KEY, fp);
    return fp;
  },

  async getDeviceInfo(): Promise<DeviceInfo> {
    const deviceId = await this.getOrCreateDeviceId();
    const fp       = await this.getFingerprint();
    return {
      deviceId,
      fingerprint:   fp,
      platform:      navigator.platform         ?? '',
      screenRes:     `${screen.width}x${screen.height}`,
      language:      navigator.language          ?? '',
      timezone:      Intl.DateTimeFormat().resolvedOptions().timeZone,
      cores:         navigator.hardwareConcurrency ?? 0,
      memory:        (navigator as { deviceMemory?: number }).deviceMemory ?? 0,
      touchPoints:   navigator.maxTouchPoints    ?? 0,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack:    navigator.doNotTrack === '1',
      createdAt:     Date.now(),
    };
  },

  async checkIntegrity(): Promise<IntegrityReport> {
    const deviceId = await this.getOrCreateDeviceId();
    const fp       = await this.getFingerprint();
    const stored   = localStorage.getItem(`jf_fp_${deviceId}`);
    const warnings: string[] = [];

    if (!stored) {
      localStorage.setItem(`jf_fp_${deviceId}`, fp);
    }

    const fingerprintMatch = !stored || stored === fp;
    if (!fingerprintMatch) warnings.push('Device fingerprint changed');
    if (!navigator.cookieEnabled) warnings.push('Cookies disabled');
    if (navigator.doNotTrack === '1') warnings.push('Do-Not-Track enabled');

    const trustScore = Math.max(0, 100 - warnings.length * 20);

    return { deviceId, fingerprintMatch, trustScore, warnings };
  },

  async getDeviceHeaders(): Promise<Record<string, string>> {
    const deviceId = await this.getOrCreateDeviceId();
    const fp       = await this.getFingerprint();
    return {
      'X-Device-ID':          deviceId,
      'X-Device-Fingerprint': fp,
    };
  },
};