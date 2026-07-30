/**
 * OfflineAuth — JWT offline validation, cached auth state, biometric unlock (WebAuthn).
 * Never re-implements the main auth flow — only handles offline JWT verification
 * and biometric unlock for an already-authenticated session.
 */

import { SecureTokenStore } from '../db/EncryptedStorage';

export interface OfflineAuthState {
  isAuthenticated: boolean;
  userId?:         string;
  expiresAt?:      number;
  offlineUntil?:   number;
}

export interface BiometricCapability {
  available:  boolean;
  type:       'fingerprint' | 'face' | 'pin' | 'none';
  platformAuthenticator: boolean;
}

const OFFLINE_GRACE_MS = 7 * 24 * 60 * 60_000;

// ─── JWT decode (no verification — offline only) ──────────────────────────────

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(b64.padEnd(b64.length + (4 - b64.length % 4) % 4, '='));
    return JSON.parse(json) as Record<string, unknown>;
  } catch { return null; }
}

function isTokenExpired(payload: Record<string, unknown>): boolean {
  const exp = payload['exp'];
  if (typeof exp !== 'number') return false;
  return exp * 1000 < Date.now();
}

// ─── OfflineAuth ──────────────────────────────────────────────────────────────

export const OfflineAuth = {
  async getState(): Promise<OfflineAuthState> {
    const creds = await SecureTokenStore.getUserCredentials();
    if (!creds) {
      const raw = localStorage.getItem('jobfast_user');
      if (!raw) return { isAuthenticated: false };
      try {
        const u = JSON.parse(raw) as { token?: string; _id?: string };
        if (!u.token) return { isAuthenticated: false };
        const payload = decodeJwtPayload(u.token);
        if (!payload) return { isAuthenticated: false };
        if (isTokenExpired(payload)) return { isAuthenticated: false };
        return {
          isAuthenticated: true,
          userId:          u._id ?? (payload['sub'] as string),
          expiresAt:       (payload['exp'] as number) * 1000,
          offlineUntil:    Date.now() + OFFLINE_GRACE_MS,
        };
      } catch { return { isAuthenticated: false }; }
    }

    if (creds.expiresAt < Date.now()) {
      return { isAuthenticated: false };
    }
    return {
      isAuthenticated: true,
      userId:          creds.userId,
      expiresAt:       creds.expiresAt,
      offlineUntil:    creds.expiresAt + OFFLINE_GRACE_MS,
    };
  },

  async saveSessionForOffline(token: string, userId: string, expiresAt: number): Promise<void> {
    await SecureTokenStore.saveUserCredentials({ userId, token, expiresAt });
    await SecureTokenStore.saveToken(token);
  },

  async clearSession(): Promise<void> {
    SecureTokenStore.clearAll();
  },

  validateOfflineToken(token: string): { valid: boolean; expired: boolean; userId?: string } {
    const payload = decodeJwtPayload(token);
    if (!payload) return { valid: false, expired: false };
    const expired = isTokenExpired(payload);
    return {
      valid:   !expired,
      expired,
      userId:  payload['sub'] as string | undefined,
    };
  },
};

// ─── Biometric (WebAuthn) ─────────────────────────────────────────────────────

export const BiometricAuth = {
  async checkCapability(): Promise<BiometricCapability> {
    if (!window.PublicKeyCredential) {
      return { available: false, type: 'none', platformAuthenticator: false };
    }
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return {
        available,
        type:                   available ? 'fingerprint' : 'none',
        platformAuthenticator:  available,
      };
    } catch {
      return { available: false, type: 'none', platformAuthenticator: false };
    }
  },

  async register(userId: string, username: string): Promise<boolean> {
    if (!window.PublicKeyCredential) return false;
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp:    { name: 'JOBFAST', id: location.hostname },
          user:  {
            id:          new TextEncoder().encode(userId),
            name:        username,
            displayName: username,
          },
          pubKeyCredParams:  [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification:        'required',
          },
          timeout: 60_000,
        },
      });
      if (!cred) return false;
      const credId = btoa(String.fromCharCode(...new Uint8Array((cred as PublicKeyCredential).rawId)));
      localStorage.setItem(`jf_bio_${userId}`, credId);
      return true;
    } catch { return false; }
  },

  async authenticate(userId: string): Promise<boolean> {
    if (!window.PublicKeyCredential) return false;
    const credId = localStorage.getItem(`jf_bio_${userId}`);
    if (!credId) return false;

    try {
      const challenge  = crypto.getRandomValues(new Uint8Array(32));
      const credIdArr  = Uint8Array.from(atob(credId), c => c.charCodeAt(0));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId:             location.hostname,
          userVerification: 'required',
          allowCredentials: [{ id: credIdArr, type: 'public-key' }],
          timeout:          60_000,
        },
      });
      return !!assertion;
    } catch { return false; }
  },

  isRegistered(userId: string): boolean {
    return !!localStorage.getItem(`jf_bio_${userId}`);
  },

  unregister(userId: string): void {
    localStorage.removeItem(`jf_bio_${userId}`);
  },
};