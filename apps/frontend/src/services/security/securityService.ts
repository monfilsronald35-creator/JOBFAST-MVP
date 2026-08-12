import { supabase } from '../../lib/supabase';
import type {
  UserDevice,
  DeviceFingerprint,
  SecurityEvent,
  SecurityEventSeverityLevel,
  FraudAlert,
  FraudAlertAction,
  FraudResolutionStatus,
  SecuritySession,
  SecurityMfaMethod,
  MfaType,
  SecurityAccessToken,
  SecurityApiKey,
} from '../../types/security';

// Security Domain Service
//
// Backend-only tables (zero functions here):
//   login_history        — ip_address = NEVER (PII); user_agent = NEVER (fingerprinting PII);
//                          always BACKEND ONLY (audit log with ip_address)
//   user_active_sessions — refresh_token_hash = ABSOLUTE NEVER; push_token = ABSOLUTE NEVER;
//                          ip_address = NEVER; session credential table: BACKEND ONLY

// ── Column constants ───────────────────────────────────────────────────────

const DEVICE_COLS = 'id, user_id, device_name, is_trusted, last_login_at, created_at';
// device_fingerprint excluded — enables cross-session tracking
// ip_address excluded — NEVER (PII)

const DEVICE_FINGERPRINT_COLS = 'id, user_id, device_name, trust_status, verified_at, created_at';
// fingerprint_hash excluded — cross-session tracking PII

const SECURITY_EVENT_COLS = 'id, user_id, event_type, severity_level, created_at';
// metadata excluded — JSONB with no type contract

const FRAUD_ALERT_COLS = 'id, user_id, alert_type, action_taken, resolution_status, human_review_required, created_at';
// risk_score excluded — NEVER (AI behavioral scoring signal; enables gaming)
// risk_factors_payload excluded — ABSOLUTE NEVER (all fraud detection signals)

const SESSION_COLS = 'id, user_id, device_name, device_type, is_current_session, is_trusted_device, biometric_verified, mfa_verified, expires_at, revoked_at, logout_reason, last_activity_at, created_at';
// device_fingerprint_hash excluded — cross-session tracking
// refresh_token_hash excluded — ABSOLUTE NEVER (session credential)
// ip_address excluded — NEVER (PII)
// risk_score excluded — NEVER (AI behavioral scoring signal)

const MFA_METHOD_COLS = 'id, user_id, factor_type, is_enabled, last_used_at, created_at';
// secret_or_public_key excluded — ABSOLUTE NEVER (TOTP seeds + WebAuthn credentials)

const ACCESS_TOKEN_COLS = 'id, user_id, token_name, token_type, scopes, expires_at, last_used_at, is_revoked, created_at';
// token_value excluded — ABSOLUTE NEVER (actual credential)
// token_hash excluded — ABSOLUTE NEVER (credential hash; enables offline comparison attacks)

const API_KEY_COLS = 'id, user_id, name, key_prefix, scopes, expires_at, last_used_at, is_revoked, created_at';
// key_hash excluded — ABSOLUTE NEVER (credential hash; enables offline comparison attacks)

// ── Row types ─────────────────────────────────────────────────────────────

type DeviceRow = { id: string; user_id: string; device_name: string | null; is_trusted: boolean; last_login_at: string; created_at: string; };
type DeviceFingerprintRow = { id: string; user_id: string; device_name: string | null; trust_status: string; verified_at: string | null; created_at: string; };
type SecurityEventRow = { id: string; user_id: string | null; event_type: string; severity_level: string; created_at: string; };
type FraudAlertRow = { id: string; user_id: string | null; alert_type: string; action_taken: string; resolution_status: string; human_review_required: boolean; created_at: string; };
type SessionRow = { id: string; user_id: string; device_name: string | null; device_type: string | null; is_current_session: boolean; is_trusted_device: boolean; biometric_verified: boolean; mfa_verified: boolean; expires_at: string; revoked_at: string | null; logout_reason: string | null; last_activity_at: string; created_at: string; };
type MfaMethodRow = { id: string; user_id: string; factor_type: string; is_enabled: boolean; last_used_at: string | null; created_at: string; };
type AccessTokenRow = { id: string; user_id: string; token_name: string | null; token_type: string; scopes: string[]; expires_at: string | null; last_used_at: string | null; is_revoked: boolean; created_at: string; };
type ApiKeyRow = { id: string; user_id: string | null; name: string; key_prefix: string; scopes: string[]; expires_at: string | null; last_used_at: string | null; is_revoked: boolean; created_at: string; };

// ── Mappers ───────────────────────────────────────────────────────────────

const mapDevice = (r: DeviceRow): UserDevice => ({ id: r.id, userId: r.user_id, deviceName: r.device_name, isTrusted: r.is_trusted, lastLoginAt: r.last_login_at, createdAt: r.created_at });
const mapDeviceFingerprint = (r: DeviceFingerprintRow): DeviceFingerprint => ({ id: r.id, userId: r.user_id, deviceName: r.device_name, trustStatus: r.trust_status as DeviceFingerprint['trustStatus'], verifiedAt: r.verified_at, createdAt: r.created_at });
const mapSecurityEvent = (r: SecurityEventRow): SecurityEvent => ({ id: r.id, userId: r.user_id, eventType: r.event_type, severityLevel: r.severity_level as SecurityEventSeverityLevel, createdAt: r.created_at });
const mapFraudAlert = (r: FraudAlertRow): FraudAlert => ({ id: r.id, userId: r.user_id, alertType: r.alert_type, actionTaken: r.action_taken as FraudAlertAction, resolutionStatus: r.resolution_status as FraudResolutionStatus, humanReviewRequired: r.human_review_required, createdAt: r.created_at });
const mapSession = (r: SessionRow): SecuritySession => ({ id: r.id, userId: r.user_id, deviceName: r.device_name, deviceType: r.device_type, isCurrentSession: r.is_current_session, isTrustedDevice: r.is_trusted_device, biometricVerified: r.biometric_verified, mfaVerified: r.mfa_verified, expiresAt: r.expires_at, revokedAt: r.revoked_at, logoutReason: r.logout_reason, lastActivityAt: r.last_activity_at, createdAt: r.created_at });
const mapMfaMethod = (r: MfaMethodRow): SecurityMfaMethod => ({ id: r.id, userId: r.user_id, factorType: r.factor_type as MfaType, isEnabled: r.is_enabled, lastUsedAt: r.last_used_at, createdAt: r.created_at });
const mapAccessToken = (r: AccessTokenRow): SecurityAccessToken => ({ id: r.id, userId: r.user_id, tokenName: r.token_name, tokenType: r.token_type, scopes: r.scopes, expiresAt: r.expires_at, lastUsedAt: r.last_used_at, isRevoked: r.is_revoked, createdAt: r.created_at });
const mapApiKey = (r: ApiKeyRow): SecurityApiKey => ({ id: r.id, userId: r.user_id, name: r.name, keyPrefix: r.key_prefix, scopes: r.scopes, expiresAt: r.expires_at, lastUsedAt: r.last_used_at, isRevoked: r.is_revoked, createdAt: r.created_at });

// ── User Devices ──────────────────────────────────────────────────────────

export async function getMyDevices(): Promise<UserDevice[]> {
  // RLS filters to current user
  const { data, error } = await supabase.from('user_devices').select(DEVICE_COLS).order('last_login_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as DeviceRow[]).map(mapDevice);
}

export async function getMyTrustedDevices(): Promise<UserDevice[]> {
  const { data, error } = await supabase.from('user_devices').select(DEVICE_COLS).eq('is_trusted', true).order('last_login_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as DeviceRow[]).map(mapDevice);
}

export async function getDevice(id: string): Promise<UserDevice | null> {
  const { data, error } = await supabase.from('user_devices').select(DEVICE_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapDevice(data as unknown as DeviceRow) : null;
}

// ── Device Fingerprint Registry ───────────────────────────────────────────

export async function getMyDeviceFingerprints(): Promise<DeviceFingerprint[]> {
  // RLS filters to current user; fingerprint_hash is never included in DEVICE_FINGERPRINT_COLS
  const { data, error } = await supabase.from('user_device_fingerprints').select(DEVICE_FINGERPRINT_COLS).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as DeviceFingerprintRow[]).map(mapDeviceFingerprint);
}

export async function getDeviceFingerprint(id: string): Promise<DeviceFingerprint | null> {
  const { data, error } = await supabase.from('user_device_fingerprints').select(DEVICE_FINGERPRINT_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapDeviceFingerprint(data as unknown as DeviceFingerprintRow) : null;
}

// ── Security Events ───────────────────────────────────────────────────────

export async function getMySecurityEvents(options: { severity?: SecurityEventSeverityLevel; limit?: number } = {}): Promise<SecurityEvent[]> {
  // RLS filters to current user
  let q = supabase.from('security_events').select(SECURITY_EVENT_COLS);
  if (options.severity) q = q.eq('severity_level', options.severity);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as unknown as SecurityEventRow[]).map(mapSecurityEvent);
}

export async function getHighSeverityEvents(options: { limit?: number } = {}): Promise<SecurityEvent[]> {
  const { data, error } = await supabase.from('security_events').select(SECURITY_EVENT_COLS).in('severity_level', ['high', 'critical']).order('created_at', { ascending: false }).limit(options.limit ?? 20);
  if (error) throw error;
  return (data as unknown as SecurityEventRow[]).map(mapSecurityEvent);
}

// ── Fraud Alerts ──────────────────────────────────────────────────────────

export async function getMyFraudAlerts(options: { status?: FraudResolutionStatus; limit?: number } = {}): Promise<FraudAlert[]> {
  // RLS filters to current user; risk signals are excluded from FRAUD_ALERT_COLS
  let q = supabase.from('fraud_alerts').select(FRAUD_ALERT_COLS);
  if (options.status) q = q.eq('resolution_status', options.status);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as unknown as FraudAlertRow[]).map(mapFraudAlert);
}

export async function getFraudAlert(id: string): Promise<FraudAlert | null> {
  const { data, error } = await supabase.from('fraud_alerts').select(FRAUD_ALERT_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapFraudAlert(data as unknown as FraudAlertRow) : null;
}

// ── Security Sessions ─────────────────────────────────────────────────────

export async function getMySessions(options: { activeOnly?: boolean; limit?: number } = {}): Promise<SecuritySession[]> {
  // RLS filters to current user; refresh_token_hash is excluded from SESSION_COLS
  let q = supabase.from('user_sessions').select(SESSION_COLS);
  if (options.activeOnly) q = q.is('revoked_at', null);
  const { data, error } = await q.order('last_activity_at', { ascending: false }).limit(options.limit ?? 20);
  if (error) throw error;
  return (data as unknown as SessionRow[]).map(mapSession);
}

export async function getSession(id: string): Promise<SecuritySession | null> {
  const { data, error } = await supabase.from('user_sessions').select(SESSION_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapSession(data as unknown as SessionRow) : null;
}

// ── MFA Methods ───────────────────────────────────────────────────────────

export async function getMyMfaMethods(options: { enabledOnly?: boolean } = {}): Promise<SecurityMfaMethod[]> {
  // RLS filters to current user; secret_or_public_key is excluded from MFA_METHOD_COLS
  let q = supabase.from('user_mfa_methods').select(MFA_METHOD_COLS);
  if (options.enabledOnly) q = q.eq('is_enabled', true);
  const { data, error } = await q.order('factor_type');
  if (error) throw error;
  return (data as unknown as MfaMethodRow[]).map(mapMfaMethod);
}

export async function getMfaMethod(id: string): Promise<SecurityMfaMethod | null> {
  const { data, error } = await supabase.from('user_mfa_methods').select(MFA_METHOD_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapMfaMethod(data as unknown as MfaMethodRow) : null;
}

export async function getMfaMethodByType(factorType: MfaType): Promise<SecurityMfaMethod | null> {
  // RLS filters to current user; UNIQUE (user_id, factor_type)
  const { data, error } = await supabase.from('user_mfa_methods').select(MFA_METHOD_COLS).eq('factor_type', factorType).maybeSingle();
  if (error) throw error;
  return data ? mapMfaMethod(data as unknown as MfaMethodRow) : null;
}

// ── Access Tokens ─────────────────────────────────────────────────────────

export async function getMyAccessTokens(options: { tokenType?: string; activeOnly?: boolean; limit?: number } = {}): Promise<SecurityAccessToken[]> {
  // RLS filters to current user; token_value and token_hash excluded from ACCESS_TOKEN_COLS
  let q = supabase.from('user_access_tokens').select(ACCESS_TOKEN_COLS);
  if (options.tokenType) q = q.eq('token_type', options.tokenType);
  if (options.activeOnly) q = q.eq('is_revoked', false);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as unknown as AccessTokenRow[]).map(mapAccessToken);
}

export async function getAccessToken(id: string): Promise<SecurityAccessToken | null> {
  const { data, error } = await supabase.from('user_access_tokens').select(ACCESS_TOKEN_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapAccessToken(data as unknown as AccessTokenRow) : null;
}

// ── API Keys ──────────────────────────────────────────────────────────────

export async function getMyApiKeys(options: { activeOnly?: boolean } = {}): Promise<SecurityApiKey[]> {
  // RLS filters to current user; key_hash excluded from API_KEY_COLS
  let q = supabase.from('user_api_keys').select(API_KEY_COLS);
  if (options.activeOnly) q = q.eq('is_revoked', false);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as ApiKeyRow[]).map(mapApiKey);
}

export async function getApiKey(id: string): Promise<SecurityApiKey | null> {
  const { data, error } = await supabase.from('user_api_keys').select(API_KEY_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapApiKey(data as unknown as ApiKeyRow) : null;
}
