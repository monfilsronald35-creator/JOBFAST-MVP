import { supabase } from '../../lib/supabase';
import type {
  AdminRole,
  AdminPermission,
  AdminRolePermission,
  AdminUser,
  AdminFeatureFlag,
  AdminFraudCase,
  FraudCaseStatus,
  AdminIncident,
  IncidentSeverity,
  IncidentStatus,
  AdminApiKey,
  AdminAnnouncement,
  AnnouncementAudience,
} from '../../types/enterprise';

// Migration 024 — Enterprise Admin Platform V5.0
//
// Backend-only tables (zero functions here):
//   admin_sessions        — token_hash = ABSOLUTE NEVER (session credential hash);
//                           ip_address = NEVER (PII)
//   admin_audit_logs      — ip_address = NEVER (PII); before_state/after_state
//                           may snapshot arbitrary sensitive data across any table
//   system_configurations — config_value TEXT may contain internal credentials,
//                           API keys, or system secrets; use backend API endpoint

// ── Column constants ───────────────────────────────────────────────────────

const ROLE_COLS = 'id, role_name, description, created_at';
const PERMISSION_COLS = 'id, permission_code, description, created_at';
const ROLE_PERMISSION_COLS = 'role_id, permission_id';
const ADMIN_USER_COLS = 'id, profile_id, role_id, is_super_admin, mfa_enabled, is_active, created_at';
const FEATURE_FLAG_COLS = 'id, flag_key, description, is_enabled, rollout_percentage, updated_at, created_at';
const FRAUD_CASE_COLS = 'id, profile_id, business_id, risk_score, detection_reason, status, assigned_admin_id, created_at';
const INCIDENT_COLS = 'id, incident_title, severity, status, assigned_team, resolution_notes, created_at, resolved_at';
const API_KEY_COLS = 'id, business_id, key_name, permissions, requests_today, is_active, created_at';
// api_key_hash excluded — ABSOLUTE NEVER (credential hash; even hash exposure
// enables offline comparison attacks against stolen hashes)
const ANNOUNCEMENT_COLS = 'id, title, message, target_audience, country_filter, is_active, created_at';

// ── Row types ─────────────────────────────────────────────────────────────

type RoleRow = { id: string; role_name: string; description: string | null; created_at: string; };
type PermissionRow = { id: string; permission_code: string; description: string | null; created_at: string; };
type RolePermissionRow = { role_id: string; permission_id: string; };
type AdminUserRow = { id: string; profile_id: string | null; role_id: string | null; is_super_admin: boolean; mfa_enabled: boolean; is_active: boolean; created_at: string; };
type FeatureFlagRow = { id: string; flag_key: string; description: string | null; is_enabled: boolean; rollout_percentage: number; updated_at: string; created_at: string; };
type FraudCaseRow = { id: string; profile_id: string | null; business_id: string | null; risk_score: number; detection_reason: string; status: FraudCaseStatus; assigned_admin_id: string | null; created_at: string; };
type IncidentRow = { id: string; incident_title: string; severity: IncidentSeverity; status: IncidentStatus; assigned_team: string; resolution_notes: string | null; created_at: string; resolved_at: string | null; };
type ApiKeyRow = { id: string; business_id: string | null; key_name: string; permissions: unknown[]; requests_today: number; is_active: boolean; created_at: string; };
type AnnouncementRow = { id: string; title: string; message: string; target_audience: AnnouncementAudience; country_filter: string | null; is_active: boolean; created_at: string; };

// ── Mappers ───────────────────────────────────────────────────────────────

const mapRole = (r: RoleRow): AdminRole => ({ id: r.id, roleName: r.role_name, description: r.description, createdAt: r.created_at });
const mapPermission = (r: PermissionRow): AdminPermission => ({ id: r.id, permissionCode: r.permission_code, description: r.description, createdAt: r.created_at });
const mapRolePermission = (r: RolePermissionRow): AdminRolePermission => ({ roleId: r.role_id, permissionId: r.permission_id });
const mapAdminUser = (r: AdminUserRow): AdminUser => ({ id: r.id, profileId: r.profile_id, roleId: r.role_id, isSuperAdmin: r.is_super_admin, mfaEnabled: r.mfa_enabled, isActive: r.is_active, createdAt: r.created_at });
const mapFeatureFlag = (r: FeatureFlagRow): AdminFeatureFlag => ({ id: r.id, flagKey: r.flag_key, description: r.description, isEnabled: r.is_enabled, rolloutPercentage: r.rollout_percentage, updatedAt: r.updated_at, createdAt: r.created_at });
const mapFraudCase = (r: FraudCaseRow): AdminFraudCase => ({ id: r.id, profileId: r.profile_id, businessId: r.business_id, riskScore: r.risk_score, detectionReason: r.detection_reason, status: r.status, assignedAdminId: r.assigned_admin_id, createdAt: r.created_at });
const mapIncident = (r: IncidentRow): AdminIncident => ({ id: r.id, incidentTitle: r.incident_title, severity: r.severity, status: r.status, assignedTeam: r.assigned_team, resolutionNotes: r.resolution_notes, createdAt: r.created_at, resolvedAt: r.resolved_at });
const mapApiKey = (r: ApiKeyRow): AdminApiKey => ({ id: r.id, businessId: r.business_id, keyName: r.key_name, permissions: r.permissions, requestsToday: r.requests_today, isActive: r.is_active, createdAt: r.created_at });
const mapAnnouncement = (r: AnnouncementRow): AdminAnnouncement => ({ id: r.id, title: r.title, message: r.message, targetAudience: r.target_audience, countryFilter: r.country_filter, isActive: r.is_active, createdAt: r.created_at });

// ── RBAC: Roles & Permissions ─────────────────────────────────────────────

export async function getAdminRoles(): Promise<AdminRole[]> {
  const { data, error } = await supabase.from('admin_roles').select(ROLE_COLS).order('role_name');
  if (error) throw error;
  return (data as RoleRow[]).map(mapRole);
}

export async function getAdminPermissions(): Promise<AdminPermission[]> {
  const { data, error } = await supabase.from('admin_permissions').select(PERMISSION_COLS).order('permission_code');
  if (error) throw error;
  return (data as PermissionRow[]).map(mapPermission);
}

export async function getRolePermissions(roleId: string): Promise<AdminRolePermission[]> {
  const { data, error } = await supabase.from('admin_role_permissions').select(ROLE_PERMISSION_COLS).eq('role_id', roleId);
  if (error) throw error;
  return (data as RolePermissionRow[]).map(mapRolePermission);
}

// ── Admin Users ───────────────────────────────────────────────────────────

export async function getAdminUsers(options: { isActive?: boolean } = {}): Promise<AdminUser[]> {
  let q = supabase.from('admin_users').select(ADMIN_USER_COLS);
  if (options.isActive !== undefined) q = q.eq('is_active', options.isActive);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as AdminUserRow[]).map(mapAdminUser);
}

export async function getMyAdminProfile(): Promise<AdminUser | null> {
  const { data, error } = await supabase.from('admin_users').select(ADMIN_USER_COLS).eq('is_active', true).maybeSingle();
  if (error) throw error;
  return data ? mapAdminUser(data as AdminUserRow) : null;
}

// ── Feature Flags ─────────────────────────────────────────────────────────

export async function getFeatureFlags(options: { isEnabled?: boolean } = {}): Promise<AdminFeatureFlag[]> {
  let q = supabase.from('admin_feature_flags').select(FEATURE_FLAG_COLS);
  if (options.isEnabled !== undefined) q = q.eq('is_enabled', options.isEnabled);
  const { data, error } = await q.order('flag_key');
  if (error) throw error;
  return (data as FeatureFlagRow[]).map(mapFeatureFlag);
}

export async function getFeatureFlagByKey(flagKey: string): Promise<AdminFeatureFlag | null> {
  const { data, error } = await supabase.from('admin_feature_flags').select(FEATURE_FLAG_COLS).eq('flag_key', flagKey).single();
  if (error) throw error;
  return data ? mapFeatureFlag(data as FeatureFlagRow) : null;
}

export async function getEnabledFeatureFlags(): Promise<AdminFeatureFlag[]> {
  const { data, error } = await supabase.from('admin_feature_flags').select(FEATURE_FLAG_COLS).eq('is_enabled', true).order('flag_key');
  if (error) throw error;
  return (data as FeatureFlagRow[]).map(mapFeatureFlag);
}

// ── Fraud Cases ───────────────────────────────────────────────────────────

export async function getFraudCases(options: { status?: FraudCaseStatus; assignedAdminId?: string; minRiskScore?: number; limit?: number } = {}): Promise<AdminFraudCase[]> {
  let q = supabase.from('admin_fraud_cases').select(FRAUD_CASE_COLS);
  if (options.status) q = q.eq('status', options.status);
  if (options.assignedAdminId) q = q.eq('assigned_admin_id', options.assignedAdminId);
  if (options.minRiskScore !== undefined) q = q.gte('risk_score', options.minRiskScore);
  const { data, error } = await q.order('risk_score', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as FraudCaseRow[]).map(mapFraudCase);
}

export async function getFraudCasesForProfile(profileId: string): Promise<AdminFraudCase[]> {
  const { data, error } = await supabase.from('admin_fraud_cases').select(FRAUD_CASE_COLS).eq('profile_id', profileId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as FraudCaseRow[]).map(mapFraudCase);
}

export async function getOpenFraudCases(options: { limit?: number } = {}): Promise<AdminFraudCase[]> {
  const { data, error } = await supabase.from('admin_fraud_cases').select(FRAUD_CASE_COLS).in('status', ['open', 'investigating']).order('risk_score', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as FraudCaseRow[]).map(mapFraudCase);
}

// ── Incidents ─────────────────────────────────────────────────────────────

export async function getIncidents(options: { status?: IncidentStatus; severity?: IncidentSeverity; limit?: number } = {}): Promise<AdminIncident[]> {
  let q = supabase.from('admin_incidents').select(INCIDENT_COLS);
  if (options.status) q = q.eq('status', options.status);
  if (options.severity) q = q.eq('severity', options.severity);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as IncidentRow[]).map(mapIncident);
}

export async function getActiveIncidents(): Promise<AdminIncident[]> {
  const { data, error } = await supabase.from('admin_incidents').select(INCIDENT_COLS).in('status', ['investigating', 'identified', 'monitoring']).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as IncidentRow[]).map(mapIncident);
}

// ── API Keys ──────────────────────────────────────────────────────────────

export async function getBusinessApiKeys(businessId: string): Promise<AdminApiKey[]> {
  const { data, error } = await supabase.from('admin_api_keys').select(API_KEY_COLS).eq('business_id', businessId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ApiKeyRow[]).map(mapApiKey);
}

export async function getActiveApiKeys(businessId: string): Promise<AdminApiKey[]> {
  const { data, error } = await supabase.from('admin_api_keys').select(API_KEY_COLS).eq('business_id', businessId).eq('is_active', true).order('key_name');
  if (error) throw error;
  return (data as ApiKeyRow[]).map(mapApiKey);
}

// ── Announcements ─────────────────────────────────────────────────────────

export async function getActiveAnnouncements(options: { audience?: AnnouncementAudience; countryCode?: string } = {}): Promise<AdminAnnouncement[]> {
  let q = supabase.from('admin_announcements').select(ANNOUNCEMENT_COLS).eq('is_active', true);
  if (options.audience) q = q.or(`target_audience.eq.all,target_audience.eq.${options.audience}`);
  if (options.countryCode) q = q.or(`country_filter.is.null,country_filter.eq.${options.countryCode}`);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as AnnouncementRow[]).map(mapAnnouncement);
}

export async function getAllAnnouncements(options: { limit?: number } = {}): Promise<AdminAnnouncement[]> {
  const { data, error } = await supabase.from('admin_announcements').select(ANNOUNCEMENT_COLS).order('created_at', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as AnnouncementRow[]).map(mapAnnouncement);
}
