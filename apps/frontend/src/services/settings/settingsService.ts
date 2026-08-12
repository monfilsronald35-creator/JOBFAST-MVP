import { supabase } from '../../lib/supabase';
import type {
  UserGlobalSettings,
  BusinessSettings,
  EnterpriseSettings,
  DeveloperSettings,
  UserStorageMetrics,
} from '../../types/settings';

// Settings & Governance Matrix (Hyper-Dimensional Singularity Core)
//
// Backend-only tables (zero functions here):
//   user_active_sessions — refresh_token_hash = ABSOLUTE NEVER; push_token = ABSOLUTE NEVER;
//                          ip_address/geo_city_name/geo_coordinates = NEVER (PII);
//                          user_agent = NEVER; risk_score = NEVER; device_fingerprint_hash excluded
//   system_audit_logs   — ip_address = NEVER; previous_state/new_state = NEVER (arbitrary snapshots);
//                          audit logs always BACKEND ONLY

// ── Column constants ───────────────────────────────────────────────────────

const USER_SETTINGS_COLS = [
  'id', 'user_id', 'locale_language', 'timezone', 'currency_preference',
  'theme', 'accent_color', 'font_scale', 'density', 'animation_level',
  'accessibility_config', 'privacy_settings', 'notification_preferences', 'ai_preferences',
  'created_at', 'updated_at',
].join(', ');
// metadata excluded — JSONB with no type contract

const BUSINESS_SETTINGS_COLS = 'id, business_id, entity_version, entity_owner, auto_accept_jobs, operational_preferences, created_at, updated_at';
// tax_override_rules excluded — internal financial configuration; may reveal pricing strategy

const ENTERPRISE_SETTINGS_COLS = 'id, organization_id, entity_version, entity_owner, compliance_frameworks, audit_retention_days, created_at, updated_at';
// sso_saml_config excluded — NEVER (SSO credential bundle; may contain IdP certs and client secrets)
// scim_provisioning_config excluded — SCIM provisioning config; may contain provisioning tokens

const DEVELOPER_SETTINGS_COLS = 'id, developer_user_id, entity_version, developer_mode_active, sandbox_environment_enabled, api_quotas_tier, sdk_preferences, oauth_consent_registry, created_at, updated_at';
// webhook_endpoints excluded — JSONB may contain endpoint secrets; use webhook_endpoints table for typed access

const STORAGE_METRICS_COLS = 'id, user_id, total_allocated_bytes, storage_used_bytes, cache_used_bytes, offline_sync_bytes, updated_at';
// downloads_history excluded — JSONB with no type contract; may contain sensitive file metadata
// exported_files_registry excluded — JSONB with no type contract; may contain content references

// ── Row types ─────────────────────────────────────────────────────────────

type UserSettingsRow = { id: string; user_id: string; locale_language: string; timezone: string; currency_preference: string; theme: string; accent_color: string; font_scale: number; density: string; animation_level: string; accessibility_config: Record<string, unknown>; privacy_settings: Record<string, unknown>; notification_preferences: Record<string, unknown>; ai_preferences: Record<string, unknown>; created_at: string; updated_at: string; };
type BusinessSettingsRow = { id: string; business_id: string; entity_version: number; entity_owner: string | null; auto_accept_jobs: boolean; operational_preferences: Record<string, unknown>; created_at: string; updated_at: string; };
type EnterpriseSettingsRow = { id: string; organization_id: string; entity_version: number; entity_owner: string | null; compliance_frameworks: string[]; audit_retention_days: number; created_at: string; updated_at: string; };
type DeveloperSettingsRow = { id: string; developer_user_id: string; entity_version: number; developer_mode_active: boolean; sandbox_environment_enabled: boolean; api_quotas_tier: string; sdk_preferences: Record<string, unknown>; oauth_consent_registry: Record<string, unknown>; created_at: string; updated_at: string; };
type StorageMetricsRow = { id: string; user_id: string; total_allocated_bytes: number; storage_used_bytes: number; cache_used_bytes: number; offline_sync_bytes: number; updated_at: string; };

// ── Mappers ───────────────────────────────────────────────────────────────

const mapUserSettings = (r: UserSettingsRow): UserGlobalSettings => ({ id: r.id, userId: r.user_id, localeLanguage: r.locale_language, timezone: r.timezone, currencyPreference: r.currency_preference, theme: r.theme, accentColor: r.accent_color, fontScale: r.font_scale, density: r.density, animationLevel: r.animation_level, accessibilityConfig: r.accessibility_config, privacySettings: r.privacy_settings, notificationPreferences: r.notification_preferences, aiPreferences: r.ai_preferences, createdAt: r.created_at, updatedAt: r.updated_at });
const mapBusinessSettings = (r: BusinessSettingsRow): BusinessSettings => ({ id: r.id, businessId: r.business_id, entityVersion: r.entity_version, entityOwner: r.entity_owner, autoAcceptJobs: r.auto_accept_jobs, operationalPreferences: r.operational_preferences, createdAt: r.created_at, updatedAt: r.updated_at });
const mapEnterpriseSettings = (r: EnterpriseSettingsRow): EnterpriseSettings => ({ id: r.id, organizationId: r.organization_id, entityVersion: r.entity_version, entityOwner: r.entity_owner, complianceFrameworks: r.compliance_frameworks, auditRetentionDays: r.audit_retention_days, createdAt: r.created_at, updatedAt: r.updated_at });
const mapDeveloperSettings = (r: DeveloperSettingsRow): DeveloperSettings => ({ id: r.id, developerUserId: r.developer_user_id, entityVersion: r.entity_version, developerModeActive: r.developer_mode_active, sandboxEnvironmentEnabled: r.sandbox_environment_enabled, apiQuotasTier: r.api_quotas_tier, sdkPreferences: r.sdk_preferences, oauthConsentRegistry: r.oauth_consent_registry, createdAt: r.created_at, updatedAt: r.updated_at });
const mapStorageMetrics = (r: StorageMetricsRow): UserStorageMetrics => ({ id: r.id, userId: r.user_id, totalAllocatedBytes: r.total_allocated_bytes, storageUsedBytes: r.storage_used_bytes, cacheUsedBytes: r.cache_used_bytes, offlineSyncBytes: r.offline_sync_bytes, updatedAt: r.updated_at });

// ── User Global Settings ──────────────────────────────────────────────────

export async function getMySettings(): Promise<UserGlobalSettings | null> {
  // RLS filters to the current user; UNIQUE (user_id) — one row per user
  const { data, error } = await supabase.from('user_global_settings').select(USER_SETTINGS_COLS).maybeSingle();
  if (error) throw error;
  return data ? mapUserSettings(data as unknown as UserSettingsRow) : null;
}

// ── Business Settings ─────────────────────────────────────────────────────

export async function getBusinessSettings(businessId: string): Promise<BusinessSettings | null> {
  const { data, error } = await supabase.from('business_settings').select(BUSINESS_SETTINGS_COLS).eq('business_id', businessId).maybeSingle();
  if (error) throw error;
  return data ? mapBusinessSettings(data as unknown as BusinessSettingsRow) : null;
}

// ── Enterprise Settings ───────────────────────────────────────────────────

export async function getEnterpriseSettings(organizationId: string): Promise<EnterpriseSettings | null> {
  const { data, error } = await supabase.from('enterprise_settings').select(ENTERPRISE_SETTINGS_COLS).eq('organization_id', organizationId).maybeSingle();
  if (error) throw error;
  return data ? mapEnterpriseSettings(data as unknown as EnterpriseSettingsRow) : null;
}

// ── Developer Settings ────────────────────────────────────────────────────

export async function getMyDeveloperSettings(): Promise<DeveloperSettings | null> {
  // RLS filters to the current user; UNIQUE (developer_user_id) — one row per developer
  const { data, error } = await supabase.from('developer_settings').select(DEVELOPER_SETTINGS_COLS).maybeSingle();
  if (error) throw error;
  return data ? mapDeveloperSettings(data as unknown as DeveloperSettingsRow) : null;
}

// ── User Storage Metrics ──────────────────────────────────────────────────

export async function getMyStorageMetrics(): Promise<UserStorageMetrics | null> {
  // RLS filters to the current user; UNIQUE (user_id) — one row per user
  const { data, error } = await supabase.from('user_storage_metrics').select(STORAGE_METRICS_COLS).maybeSingle();
  if (error) throw error;
  return data ? mapStorageMetrics(data as unknown as StorageMetricsRow) : null;
}
