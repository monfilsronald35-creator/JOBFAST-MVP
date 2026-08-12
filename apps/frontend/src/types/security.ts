// ── Security Domain Types ─────────────────────────────────────────────────
//
// Backend-only tables (no frontend types):
//   login_history        — ip_address = NEVER (PII); user_agent = NEVER (fingerprinting PII);
//                          audit log with ip_address — always BACKEND ONLY
//   user_active_sessions — refresh_token_hash = ABSOLUTE NEVER; push_token = ABSOLUTE NEVER;
//                          ip_address = NEVER; geo_coordinates = NEVER; risk_score = NEVER;
//                          user_agent = NEVER — session credential table: BACKEND ONLY

// ── Const unions ─────────────────────────────────────────────────────────

export const SECURITY_EVENT_SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export type SecurityEventSeverityLevel = typeof SECURITY_EVENT_SEVERITY_LEVELS[number];

export const DEVICE_TRUST_STATUSES = ['trusted', 'pending', 'revoked'] as const;
export type DeviceTrustStatus = typeof DEVICE_TRUST_STATUSES[number];

export const MFA_TYPES = ['totp', 'sms', 'email', 'webauthn', 'backup_code'] as const;
export type MfaType = typeof MFA_TYPES[number];

export const FRAUD_ALERT_ACTIONS = ['block', 'flag', 'review', 'allow', 'escalate'] as const;
export type FraudAlertAction = typeof FRAUD_ALERT_ACTIONS[number];

export const FRAUD_RESOLUTION_STATUSES = ['pending', 'investigating', 'resolved', 'false_positive'] as const;
export type FraudResolutionStatus = typeof FRAUD_RESOLUTION_STATUSES[number];

// ── User Devices ──────────────────────────────────────────────────────────

export interface UserDevice {
  id: string;
  userId: string;
  deviceName: string | null;
  // device_fingerprint excluded — enables cross-session tracking
  // ip_address excluded — NEVER (PII)
  isTrusted: boolean;
  lastLoginAt: string;
  createdAt: string;
}

export interface DeviceFingerprint {
  id: string;
  userId: string;
  deviceName: string | null;
  // fingerprint_hash excluded — cross-session tracking PII
  trustStatus: DeviceTrustStatus;
  verifiedAt: string | null;
  createdAt: string;
}

// ── Security Events ───────────────────────────────────────────────────────

export interface SecurityEvent {
  id: string;
  userId: string | null;
  eventType: string; // 'password_reset' | 'suspicious_login' | '2fa_enabled'
  severityLevel: SecurityEventSeverityLevel;
  // metadata excluded — JSONB with no type contract
  createdAt: string;
}

// ── Fraud Alerts ──────────────────────────────────────────────────────────

export interface FraudAlert {
  id: string;
  userId: string | null;
  alertType: string; // 'suspicious_login' | 'payment_anomaly' | 'account_takeover'
  // risk_score excluded — NEVER (AI behavioral scoring signal; enables gaming)
  // risk_factors_payload excluded — ABSOLUTE NEVER (all fraud detection signals)
  actionTaken: FraudAlertAction;
  resolutionStatus: FraudResolutionStatus;
  humanReviewRequired: boolean;
  createdAt: string;
}

// ── Sessions (display-only subset) ───────────────────────────────────────

export interface SecuritySession {
  id: string;
  userId: string;
  deviceName: string | null;
  deviceType: string | null;
  // device_fingerprint_hash excluded — cross-session tracking
  // refresh_token_hash excluded — ABSOLUTE NEVER (session credential)
  // ip_address excluded — NEVER (PII)
  // risk_score excluded — NEVER (AI behavioral scoring signal)
  isCurrentSession: boolean;
  isTrustedDevice: boolean;
  biometricVerified: boolean;
  mfaVerified: boolean;
  expiresAt: string;
  revokedAt: string | null;
  logoutReason: string | null;
  lastActivityAt: string;
  createdAt: string;
}

// ── MFA Methods ───────────────────────────────────────────────────────────

export interface SecurityMfaMethod {
  id: string;
  userId: string;
  factorType: MfaType;
  // secret_or_public_key excluded — ABSOLUTE NEVER (TOTP seeds + WebAuthn credentials)
  isEnabled: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

// ── Access Tokens & API Keys (display-only) ───────────────────────────────

export interface SecurityAccessToken {
  id: string;
  userId: string;
  tokenName: string | null;
  tokenType: string; // 'api_key' | 'oauth_token' | 'service_account'
  // token_value excluded — ABSOLUTE NEVER (actual credential)
  // token_hash excluded — ABSOLUTE NEVER (credential hash; enables offline comparison attacks)
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  isRevoked: boolean;
  createdAt: string;
}

export interface SecurityApiKey {
  id: string;
  userId: string | null;
  name: string;
  keyPrefix: string; // short display hint only — intentionally public (e.g. "sk_abc123")
  // key_hash excluded — ABSOLUTE NEVER (credential hash; enables offline comparison attacks)
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  isRevoked: boolean;
  createdAt: string;
}
