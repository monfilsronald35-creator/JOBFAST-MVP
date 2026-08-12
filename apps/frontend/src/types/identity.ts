export const DEVICE_TYPES = [
  'android',
  'iphone',
  'ipad',
  'web',
  'desktop',
  'linux',
  'macos',
] as const;

export type DeviceType = typeof DEVICE_TYPES[number];

export const SOCIAL_PROVIDERS = [
  'google',
  'apple',
  'facebook',
  'microsoft',
  'github',
  'linkedin',
  'x',
  'discord',
  'telegram',
] as const;

export type SocialProvider =
  typeof SOCIAL_PROVIDERS[number];

export const MFA_TYPES = [
  'sms',
  'email',
  'totp',
  'authenticator',
] as const;

export type MfaType = typeof MFA_TYPES[number];

export const OTP_PURPOSES = [
  'register',
  'login',
  'forgot_password',
  'phone_verify',
  'email_verify',
  'mfa',
] as const;

export type OtpPurpose =
  typeof OTP_PURPOSES[number];

export const OTP_SENT_VIA = [
  'sms',
  'email',
  'whatsapp',
  'voice',
  'push',
] as const;

export type OtpSentVia =
  typeof OTP_SENT_VIA[number];

export const SECURITY_EVENT_TYPES = [
  'password_changed',
  'mfa_enabled',
  'mfa_disabled',
  'device_removed',
  'account_locked',
  'account_unlocked',
  'new_device_login',
  'location_changed',
  'email_changed',
  'phone_changed',
] as const;

export type SecurityEventType =
  typeof SECURITY_EVENT_TYPES[number];

export const SECURITY_SEVERITIES = [
  'info',
  'warning',
  'critical',
] as const;

export type SecuritySeverity =
  typeof SECURITY_SEVERITIES[number];

export interface UserDevice {
  id: string;
  userId: string;

  deviceIdentifier: string;
  deviceFingerprint: string | null;
  pushToken: string | null;

  deviceName: string | null;
  manufacturer: string | null;
  model: string | null;
  osVersion: string | null;
  platformVersion: string | null;
  appVersion: string | null;

  deviceType: DeviceType;

  locale: string | null;
  timezone: string | null;
  ipAddress: string | null;

  isActive: boolean;

  lastUsedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrustedDevice {
  id: string;
  userId: string;

  deviceFingerprint: string;
  deviceName: string | null;

  trustedUntil: string;

  isRevoked: boolean;

  lastUsedAt: string | null;
  revokedAt: string | null;

  createdAt: string;
}

export interface LoginHistory {
  id: string;

  userId: string | null;
  deviceId: string | null;

  emailAttempted: string | null;

  success: boolean;
  failureReason: string | null;

  ip: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;

  countryCode: string | null;
  city: string | null;

  latitude: number | null;
  longitude: number | null;

  riskScore: number | null;

  createdAt: string;
}

export interface MfaSettings {
  id: string;
  userId: string;

  isEnabled: boolean;
  mfaType: MfaType | null;

  secretKey: string | null;

  backupCodesHash: Record<string, unknown> | null;

  createdAt: string;
  updatedAt: string;
}

export interface OtpRequest {
  id: string;

  userId: string | null;

  identifier: string;

  // Sa a se hash la sèlman.
  // Frontend pa dwe janm resevwa OTP plaintext la.
  codeHash: string;

  purpose: OtpPurpose;
  sentVia: OtpSentVia;

  attempts: number;
  maxAttempts: number;

  consumed: boolean;

  verifiedAt: string | null;
  expiresAt: string;

  createdAt: string;
}

export interface PasswordReset {
  id: string;
  userId: string;

  tokenHash: string;

  used: boolean;

  requestedIp: string | null;
  requestedUserAgent: string | null;

  usedAt: string | null;
  expiresAt: string;

  createdAt: string;
}

export interface SocialAccount {
  id: string;
  userId: string;

  provider: SocialProvider;
  providerUserId: string;

  providerEmail: string | null;

  accessTokenHash: string | null;
  refreshTokenHash: string | null;

  // Pa ekspoze sa bay UI.
  tokenEncrypted: string | null;

  expiresAt: string | null;

  linkedAt: string;
  lastLoginAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface SecurityEvent {
  id: string;

  userId: string;

  eventType: SecurityEventType;
  severity: SecuritySeverity;

  ip: string | null;
  userAgent: string | null;

  metadata: Record<string, unknown> | null;

  resolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;

  createdAt: string;
}
