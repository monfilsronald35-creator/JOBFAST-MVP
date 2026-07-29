/**
 * Security Client — Enterprise-grade security layer.
 * Handles: JWT rotation, WebAuthn/Passkey, device fingerprint,
 * CSRF, risk engine, rate limits, session management, encryption policies.
 *
 * All operations are backend-driven to prevent client-side spoofing.
 */
import API from '../api/axios';
import type { ApiResponse, DeviceFingerprint, RiskProfile } from '../types';

// ─── Device Fingerprint ───────────────────────────────────────────────────────
function collectFingerprint(): Omit<DeviceFingerprint, 'deviceId'> {
  return {
    browser: navigator.userAgent,
    os: navigator.platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    hardwareConcurrency: navigator.hardwareConcurrency,
  };
}

// ─── CSRF Token (stored in module scope after first load) ─────────────────────
let _csrfToken: string | null = null;

export function getCSRFToken(): string | null {
  return _csrfToken;
}

// ─── Encryption Policies ──────────────────────────────────────────────────────
export interface EncryptionPolicy {
  readonly fields: readonly string[];
  readonly algorithm: string;
  readonly keyRotationDays: number;
}

// ─── CAPTCHA Config ───────────────────────────────────────────────────────────
export interface CaptchaConfig {
  readonly enabled: boolean;
  readonly provider: 'hcaptcha' | 'recaptcha_v3' | 'turnstile';
  readonly siteKey: string;
  readonly threshold?: number;
}

const securityClient = {
  /** Register device fingerprint with backend risk engine */
  registerDeviceFingerprint: async (): Promise<string> => {
    const fingerprint = collectFingerprint();
    const res = await API.post<ApiResponse<{ deviceId: string }>>('/security/device/register', fingerprint);
    return res.data.data.deviceId;
  },

  /** Ensure short-lived tokens are rotated and bound */
  ensureRotatingTokens: async (): Promise<void> => {
    await API.post('/security/tokens/rotate').catch(() => {});
  },

  /** Setup CSRF token (retrieve from backend, store for later use) */
  setupCSRFProtection: async (): Promise<void> => {
    try {
      const res = await API.get<ApiResponse<{ token: string }>>('/security/csrf-token');
      _csrfToken = res.data.data.token;
      API.defaults.headers.common['X-CSRF-Token'] = _csrfToken;
    } catch {
      // Non-blocking — CSRF from cookie is the primary protection
    }
  },

  /** Check if WebAuthn/Passkey is supported in this browser */
  supportsWebAuthn: (): boolean => {
    return (
      typeof window !== 'undefined' &&
      typeof window.PublicKeyCredential !== 'undefined'
    );
  },

  /** Bootstrap WebAuthn passkey registration for current user */
  bootstrapWebAuthnPasskey: async (): Promise<void> => {
    if (!securityClient.supportsWebAuthn()) return;
    try {
      const res = await API.post<ApiResponse<PublicKeyCredentialCreationOptions>>(
        '/security/webauthn/register/begin',
      );
      const options = res.data.data;
      const credential = await navigator.credentials.create({ publicKey: options });
      if (!credential) return;
      await API.post('/security/webauthn/register/complete', { credential });
    } catch {
      // Passkey setup is optional and non-blocking
    }
  },

  /** Sync user's risk profile with backend */
  syncRiskProfile: async (): Promise<RiskProfile | null> => {
    try {
      const res = await API.get<ApiResponse<RiskProfile>>('/security/risk-profile');
      return res.data.data;
    } catch {
      return null;
    }
  },

  /** Sync session state with backend (rate limits, active sessions count) */
  syncSessionState: async (): Promise<void> => {
    await API.post('/security/session/sync').catch(() => {});
  },

  /** Load CAPTCHA configuration for current user/IP risk level */
  loadCaptchaConfig: async (): Promise<CaptchaConfig | null> => {
    try {
      const res = await API.get<ApiResponse<CaptchaConfig>>('/security/captcha/config');
      return res.data.data;
    } catch {
      return null;
    }
  },

  /** Load field-level encryption policies */
  loadEncryptionPolicies: async (): Promise<readonly EncryptionPolicy[]> => {
    try {
      const res = await API.get<ApiResponse<readonly EncryptionPolicy[]>>('/security/encryption/policies');
      return res.data.data;
    } catch {
      return [];
    }
  },

  /** Verify suspicious login (device mismatch, geo anomaly) */
  verifySuspiciousLogin: async (token: string): Promise<{ verified: boolean }> => {
    const res = await API.post<ApiResponse<{ verified: boolean }>>('/security/verify-login', { token });
    return res.data.data;
  },

  /** Report a security incident */
  reportIncident: async (type: string, details: Record<string, unknown>): Promise<void> => {
    await API.post('/security/incidents', { type, details }).catch(() => {});
  },
};

export { securityClient };
export default securityClient;