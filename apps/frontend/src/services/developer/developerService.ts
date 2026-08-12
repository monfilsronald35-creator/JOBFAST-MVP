import { supabase } from '../../lib/supabase';
import type {
  DeveloperApp,
  ApiKey,
  WebhookEndpoint,
  Organization,
  OrganizationMember,
  PlatformHealthReport,
  ApiUsageQuota,
  EnterpriseInvoice,
  EnterpriseSubscription,
  OrganizationRole,
  OrganizationPermission,
  OrganizationRolePermission,
  OrganizationMemberRole,
  OrganizationInvitation,
  OrganizationAccessRequest,
  UserTrustedDevice,
  OrganizationServiceAccount,
} from '../../types/developer';

// Migrations 025–026 — Developer Platform & Hyper-Scale Enterprise
//
// Backend-only tables (zero functions here):
//   api_request_logs      — ip_address = NEVER (PII); user_agent = fingerprinting PII
//   webhook_deliveries    — payload may contain PII; response_body = internal gateway data
//   secret_vaults         — encrypted_value = ABSOLUTE NEVER; even key names are sensitive
//   compliance_audit_logs — ip_address = NEVER (PII); audit logs always backend-only
//   distributed_locks     — internal locking; never needed by client
//   ai_event_streams      — embedding_vector(1536) = NEVER; context_payload = internal AI data
//   quantum_cache_nodes   — internal cache infrastructure
//   global_edge_invalidations — internal cache-invalidation queue

// ── Column constants ───────────────────────────────────────────────────────

const DEV_APP_COLS = [
  'id', 'user_id', 'name', 'slug', 'description', 'client_id',
  'redirect_uris', 'allowed_scopes', 'rate_limit_tier',
  'is_active', 'is_deleted', 'deleted_at', 'created_at', 'updated_at',
].join(', ');
// client_secret_hash excluded — ABSOLUTE NEVER (OAuth2 client secret hash)
// metadata excluded — JSONB with no type contract; may contain sensitive internal config

const API_KEY_COLS = 'id, app_id, user_id, name, key_prefix, scopes, expires_at, last_used_at, is_revoked, created_at';
// key_hash excluded — ABSOLUTE NEVER (credential hash; enables offline comparison attacks)

const WEBHOOK_COLS = [
  'id', 'app_id', 'url', 'subscribed_events', 'is_active',
  'circuit_state', 'consecutive_failures', 'max_consecutive_failures',
  'cooldown_until', 'success_rate_rolling', 'target_region', 'timeout_ms',
  'created_at', 'updated_at',
].join(', ');
// secret_key_encrypted excluded — ABSOLUTE NEVER (encrypted HMAC signing secret)
// headers excluded — may contain Authorization headers or API keys sent with requests
// metadata excluded — JSONB with no type contract; may contain sensitive internal state

const ORG_COLS = [
  'id', 'name', 'slug', 'legal_name', 'logo_url', 'locale', 'timezone',
  'primary_domain', 'domain_verified_at', 'domain_ownership_status', 'allowed_domains',
  'sso_enabled', 'sso_provider', 'sso_issuer_url', 'sso_client_id',
  'tier', 'status', 'is_active', 'is_deleted', 'deleted_at', 'created_at', 'updated_at',
].join(', ');
// tax_id excluded — NEVER (EIN/VAT equivalent)
// billing_email excluded — PII; admin contact not needed by regular members
// domain_verification_token excluded — security token; enables domain hijacking
// sso_client_secret_encrypted excluded — ABSOLUTE NEVER (encrypted SSO client secret)
// sso_metadata_xml excluded — NEVER (SAML metadata with certs; enables SAML forgery)
// sso_config excluded — NEVER (full SSO credential bundle)
// security_policies excluded — internal configuration; revealing policies aids attackers
// metadata excluded — JSONB with no type contract

const ORG_MEMBER_COLS = 'id, organization_id, user_id, role, permissions, is_active, status, joined_at, is_deleted, deleted_at, created_at';
// member_risk_score excluded — NEVER (risk scoring signal)
// scim_external_id, external_tenant_id, provisioning_version excluded — internal SCIM state
// metadata excluded — JSONB with no type contract

const HEALTH_COLS = 'id, service_name, status, latency_ms, region_code, checked_at';
// metrics_snapshot excluded — internal system metrics; reveals infrastructure topology
// node_instance_id excluded — internal cloud node identifier; reveals server instance topology

const QUOTA_COLS = 'id, app_id, organization_id, metric_type, allowed_limit, current_usage, reset_at, updated_at';

const INVOICE_COLS = 'id, organization_id, stripe_invoice_id, amount_due, amount_paid, currency, tax_amount, status, billing_period_start, billing_period_end, invoice_pdf_url, created_at, updated_at';

// ── Row types ─────────────────────────────────────────────────────────────

type DevAppRow = { id: string; user_id: string | null; name: string; slug: string; description: string | null; client_id: string; redirect_uris: string[]; allowed_scopes: string[]; rate_limit_tier: string; is_active: boolean; is_deleted: boolean; deleted_at: string | null; created_at: string; updated_at: string; };
type ApiKeyRow = { id: string; app_id: string | null; user_id: string | null; name: string; key_prefix: string; scopes: string[]; expires_at: string | null; last_used_at: string | null; is_revoked: boolean; created_at: string; };
type WebhookRow = { id: string; app_id: string | null; url: string; subscribed_events: string[]; is_active: boolean; circuit_state: string; consecutive_failures: number; max_consecutive_failures: number; cooldown_until: string | null; success_rate_rolling: number; target_region: string; timeout_ms: number; created_at: string; updated_at: string; };
type OrgRow = { id: string; name: string; slug: string; legal_name: string | null; logo_url: string | null; locale: string; timezone: string; primary_domain: string | null; domain_verified_at: string | null; domain_ownership_status: string; allowed_domains: string[]; sso_enabled: boolean; sso_provider: string; sso_issuer_url: string | null; sso_client_id: string | null; tier: string; status: string; is_active: boolean; is_deleted: boolean; deleted_at: string | null; created_at: string; updated_at: string; };
type OrgMemberRow = { id: string; organization_id: string; user_id: string | null; role: string; permissions: string[]; is_active: boolean; status: string; joined_at: string; is_deleted: boolean; deleted_at: string | null; created_at: string; };
type HealthRow = { id: string; service_name: string; status: string; latency_ms: number | null; region_code: string | null; checked_at: string; };
type QuotaRow = { id: string; app_id: string | null; organization_id: string | null; metric_type: string; allowed_limit: number; current_usage: number; reset_at: string; updated_at: string; };
type InvoiceRow = { id: string; organization_id: string | null; stripe_invoice_id: string | null; amount_due: number; amount_paid: number; currency: string; tax_amount: number; status: string; billing_period_start: string; billing_period_end: string; invoice_pdf_url: string | null; created_at: string; updated_at: string; };

// ── Mappers ───────────────────────────────────────────────────────────────

const mapDevApp = (r: DevAppRow): DeveloperApp => ({ id: r.id, userId: r.user_id, name: r.name, slug: r.slug, description: r.description, clientId: r.client_id, redirectUris: r.redirect_uris, allowedScopes: r.allowed_scopes, rateLimitTier: r.rate_limit_tier, isActive: r.is_active, isDeleted: r.is_deleted, deletedAt: r.deleted_at, createdAt: r.created_at, updatedAt: r.updated_at });
const mapApiKey = (r: ApiKeyRow): ApiKey => ({ id: r.id, appId: r.app_id, userId: r.user_id, name: r.name, keyPrefix: r.key_prefix, scopes: r.scopes, expiresAt: r.expires_at, lastUsedAt: r.last_used_at, isRevoked: r.is_revoked, createdAt: r.created_at });
const mapWebhook = (r: WebhookRow): WebhookEndpoint => ({ id: r.id, appId: r.app_id, url: r.url, subscribedEvents: r.subscribed_events, isActive: r.is_active, circuitState: r.circuit_state, consecutiveFailures: r.consecutive_failures, maxConsecutiveFailures: r.max_consecutive_failures, cooldownUntil: r.cooldown_until, successRateRolling: r.success_rate_rolling, targetRegion: r.target_region, timeoutMs: r.timeout_ms, createdAt: r.created_at, updatedAt: r.updated_at });
const mapOrg = (r: OrgRow): Organization => ({ id: r.id, name: r.name, slug: r.slug, legalName: r.legal_name, logoUrl: r.logo_url, locale: r.locale, timezone: r.timezone, primaryDomain: r.primary_domain, domainVerifiedAt: r.domain_verified_at, domainOwnershipStatus: r.domain_ownership_status, allowedDomains: r.allowed_domains, ssoEnabled: r.sso_enabled, ssoProvider: r.sso_provider, ssoIssuerUrl: r.sso_issuer_url, ssoClientId: r.sso_client_id, tier: r.tier, status: r.status, isActive: r.is_active, isDeleted: r.is_deleted, deletedAt: r.deleted_at, createdAt: r.created_at, updatedAt: r.updated_at });
const mapOrgMember = (r: OrgMemberRow): OrganizationMember => ({ id: r.id, organizationId: r.organization_id, userId: r.user_id, role: r.role, permissions: r.permissions, isActive: r.is_active, status: r.status, joinedAt: r.joined_at, isDeleted: r.is_deleted, deletedAt: r.deleted_at, createdAt: r.created_at });
const mapHealth = (r: HealthRow): PlatformHealthReport => ({ id: r.id, serviceName: r.service_name, status: r.status, latencyMs: r.latency_ms, regionCode: r.region_code, checkedAt: r.checked_at });
const mapQuota = (r: QuotaRow): ApiUsageQuota => ({ id: r.id, appId: r.app_id, organizationId: r.organization_id, metricType: r.metric_type, allowedLimit: r.allowed_limit, currentUsage: r.current_usage, resetAt: r.reset_at, updatedAt: r.updated_at });
const mapInvoice = (r: InvoiceRow): EnterpriseInvoice => ({ id: r.id, organizationId: r.organization_id, stripeInvoiceId: r.stripe_invoice_id, amountDue: r.amount_due, amountPaid: r.amount_paid, currency: r.currency, taxAmount: r.tax_amount, status: r.status, billingPeriodStart: r.billing_period_start, billingPeriodEnd: r.billing_period_end, invoicePdfUrl: r.invoice_pdf_url, createdAt: r.created_at, updatedAt: r.updated_at });

// ── Developer Apps ────────────────────────────────────────────────────────

export async function getMyDeveloperApps(): Promise<DeveloperApp[]> {
  const { data, error } = await supabase.from('developer_apps').select(DEV_APP_COLS).eq('is_deleted', false).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as DevAppRow[]).map(mapDevApp);
}

export async function getDeveloperApp(id: string): Promise<DeveloperApp | null> {
  const { data, error } = await supabase.from('developer_apps').select(DEV_APP_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapDevApp(data as unknown as DevAppRow) : null;
}

export async function getActiveApps(): Promise<DeveloperApp[]> {
  const { data, error } = await supabase.from('developer_apps').select(DEV_APP_COLS).eq('is_active', true).eq('is_deleted', false).order('name');
  if (error) throw error;
  return (data as unknown as DevAppRow[]).map(mapDevApp);
}

// ── API Keys ──────────────────────────────────────────────────────────────

export async function getAppApiKeys(appId: string): Promise<ApiKey[]> {
  const { data, error } = await supabase.from('api_keys').select(API_KEY_COLS).eq('app_id', appId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ApiKeyRow[]).map(mapApiKey);
}

export async function getActiveApiKeys(appId: string): Promise<ApiKey[]> {
  const { data, error } = await supabase.from('api_keys').select(API_KEY_COLS).eq('app_id', appId).eq('is_revoked', false).order('name');
  if (error) throw error;
  return (data as ApiKeyRow[]).map(mapApiKey);
}

export async function getMyApiKeys(): Promise<ApiKey[]> {
  const { data, error } = await supabase.from('api_keys').select(API_KEY_COLS).eq('is_revoked', false).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ApiKeyRow[]).map(mapApiKey);
}

// ── Webhook Endpoints ─────────────────────────────────────────────────────

export async function getAppWebhooks(appId: string): Promise<WebhookEndpoint[]> {
  const { data, error } = await supabase.from('webhook_endpoints').select(WEBHOOK_COLS).eq('app_id', appId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as WebhookRow[]).map(mapWebhook);
}

export async function getActiveWebhooks(appId: string): Promise<WebhookEndpoint[]> {
  const { data, error } = await supabase.from('webhook_endpoints').select(WEBHOOK_COLS).eq('app_id', appId).eq('is_active', true).order('url');
  if (error) throw error;
  return (data as unknown as WebhookRow[]).map(mapWebhook);
}

// ── Organizations ─────────────────────────────────────────────────────────

export async function getMyOrganizations(): Promise<Organization[]> {
  // RLS policy "Members can view own organizations" handles the membership filter
  const { data, error } = await supabase.from('organizations').select(ORG_COLS).eq('is_deleted', false).eq('is_active', true).order('name');
  if (error) throw error;
  return (data as unknown as OrgRow[]).map(mapOrg);
}

export async function getOrganization(id: string): Promise<Organization | null> {
  const { data, error } = await supabase.from('organizations').select(ORG_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapOrg(data as unknown as OrgRow) : null;
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const { data, error } = await supabase.from('organizations').select(ORG_COLS).eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data ? mapOrg(data as unknown as OrgRow) : null;
}

// ── Organization Members ──────────────────────────────────────────────────

export async function getOrganizationMembers(organizationId: string, options: { isActive?: boolean } = {}): Promise<OrganizationMember[]> {
  let q = supabase.from('organization_members').select(ORG_MEMBER_COLS).eq('organization_id', organizationId);
  if (options.isActive !== undefined) q = q.eq('is_active', options.isActive);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as OrgMemberRow[]).map(mapOrgMember);
}

export async function getMyMembership(organizationId: string): Promise<OrganizationMember | null> {
  const { data, error } = await supabase.from('organization_members').select(ORG_MEMBER_COLS).eq('organization_id', organizationId).maybeSingle();
  if (error) throw error;
  return data ? mapOrgMember(data as OrgMemberRow) : null;
}

// ── Platform Health ───────────────────────────────────────────────────────

export async function getLatestHealthReports(): Promise<PlatformHealthReport[]> {
  const { data, error } = await supabase.from('platform_health_reports').select(HEALTH_COLS).order('checked_at', { ascending: false }).limit(50);
  if (error) throw error;
  return (data as HealthRow[]).map(mapHealth);
}

export async function getServiceHealth(serviceName: string): Promise<PlatformHealthReport | null> {
  const { data, error } = await supabase.from('platform_health_reports').select(HEALTH_COLS).eq('service_name', serviceName).order('checked_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? mapHealth(data as HealthRow) : null;
}

// ── API Usage Quotas ──────────────────────────────────────────────────────

export async function getAppQuotas(appId: string): Promise<ApiUsageQuota[]> {
  const { data, error } = await supabase.from('api_usage_quotas').select(QUOTA_COLS).eq('app_id', appId).order('metric_type');
  if (error) throw error;
  return (data as QuotaRow[]).map(mapQuota);
}

export async function getOrgQuotas(organizationId: string): Promise<ApiUsageQuota[]> {
  const { data, error } = await supabase.from('api_usage_quotas').select(QUOTA_COLS).eq('organization_id', organizationId).order('metric_type');
  if (error) throw error;
  return (data as QuotaRow[]).map(mapQuota);
}

export async function getQuotasNearLimit(appId: string, thresholdPercent = 80): Promise<ApiUsageQuota[]> {
  const { data, error } = await supabase.from('api_usage_quotas').select(QUOTA_COLS).eq('app_id', appId);
  if (error) throw error;
  const quotas = (data as QuotaRow[]).map(mapQuota);
  return quotas.filter(q => q.allowedLimit > 0 && (q.currentUsage / q.allowedLimit) * 100 >= thresholdPercent);
}

// ── Enterprise Invoices ───────────────────────────────────────────────────

export async function getOrgInvoices(organizationId: string, options: { status?: string; limit?: number } = {}): Promise<EnterpriseInvoice[]> {
  let q = supabase.from('enterprise_invoices').select(INVOICE_COLS).eq('organization_id', organizationId);
  if (options.status) q = q.eq('status', options.status);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as InvoiceRow[]).map(mapInvoice);
}

export async function getEnterpriseInvoice(id: string): Promise<EnterpriseInvoice | null> {
  const { data, error } = await supabase.from('enterprise_invoices').select(INVOICE_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapInvoice(data as InvoiceRow) : null;
}

export async function getUnpaidInvoices(organizationId: string): Promise<EnterpriseInvoice[]> {
  const { data, error } = await supabase.from('enterprise_invoices').select(INVOICE_COLS).eq('organization_id', organizationId).in('status', ['draft', 'open', 'pending']).order('billing_period_start', { ascending: false });
  if (error) throw error;
  return (data as InvoiceRow[]).map(mapInvoice);
}

// ── Enterprise Subscriptions ──────────────────────────────────────────────
//
// api_usage_metrics — BACKEND ONLY: client_ip = NEVER (PII); anomaly_score = NEVER
//                     (AI behavioral scoring); raw per-request telemetry; frontend
//                     reads aggregated quota state from api_usage_quotas instead

const ENTERPRISE_SUB_COLS = [
  'id', 'organization_id', 'plan_code', 'plan_name', 'status', 'billing_cycle',
  'current_period_start', 'current_period_end', 'trial_ends_at', 'auto_renew',
  'usage_limits', 'base_price_amount', 'overage_rate_per_unit', 'currency',
  'created_at', 'updated_at',
].join(', ');
// settlement_ledger_hash excluded — internal audit chain integrity hash
// metadata excluded — JSONB with no type contract

type EnterpriseSubscriptionRow = { id: string; organization_id: string; plan_code: string; plan_name: string; status: string; billing_cycle: string; current_period_start: string; current_period_end: string; trial_ends_at: string | null; auto_renew: boolean; usage_limits: Record<string, unknown>; base_price_amount: number; overage_rate_per_unit: number; currency: string; created_at: string; updated_at: string; };

const mapEnterpriseSubscription = (r: EnterpriseSubscriptionRow): EnterpriseSubscription => ({ id: r.id, organizationId: r.organization_id, planCode: r.plan_code, planName: r.plan_name, status: r.status, billingCycle: r.billing_cycle, currentPeriodStart: r.current_period_start, currentPeriodEnd: r.current_period_end, trialEndsAt: r.trial_ends_at, autoRenew: r.auto_renew, usageLimits: r.usage_limits, basePriceAmount: r.base_price_amount, overageRatePerUnit: r.overage_rate_per_unit, currency: r.currency, createdAt: r.created_at, updatedAt: r.updated_at });

export async function getOrgSubscription(organizationId: string): Promise<EnterpriseSubscription | null> {
  // One subscription per organization (UNIQUE constraint on organization_id)
  const { data, error } = await supabase.from('enterprise_subscriptions').select(ENTERPRISE_SUB_COLS).eq('organization_id', organizationId).maybeSingle();
  if (error) throw error;
  return data ? mapEnterpriseSubscription(data as unknown as EnterpriseSubscriptionRow) : null;
}

export async function getMyOrgSubscription(): Promise<EnterpriseSubscription | null> {
  // RLS filters to the current user's organization
  const { data, error } = await supabase.from('enterprise_subscriptions').select(ENTERPRISE_SUB_COLS).maybeSingle();
  if (error) throw error;
  return data ? mapEnterpriseSubscription(data as unknown as EnterpriseSubscriptionRow) : null;
}

export async function getActiveSubscriptions(): Promise<EnterpriseSubscription[]> {
  const { data, error } = await supabase.from('enterprise_subscriptions').select(ENTERPRISE_SUB_COLS).in('status', ['active', 'trial', 'sovereign_lifetime']).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as EnterpriseSubscriptionRow[]).map(mapEnterpriseSubscription);
}

// ── Migration v13.3 — Global Zero-Trust Identity & IAM Mesh ──────────────
//
// Backend-only tables (zero functions here):
//   user_mfa_methods — secret_or_public_key = ABSOLUTE NEVER (holds both TOTP
//                      seeds and WebAuthn credentials in a single column)
//   user_sessions    — refresh_token_hash = ABSOLUTE NEVER (session credential);
//                      ip_address = NEVER (PII); user_agent = fingerprinting PII
//   audit_logs       — ip_address = NEVER (PII); audit logs always backend-only

// ── v13.3 Column constants ────────────────────────────────────────────────

const ORG_ROLE_COLS = 'id, organization_id, name, description, is_system_role, created_at';

const ORG_PERMISSION_COLS = 'id, code, description, created_at';

const ORG_ROLE_PERMISSION_COLS = 'id, role_id, permission_id';

const ORG_MEMBER_ROLE_COLS = 'id, member_id, role_id';

const ORG_INVITATION_COLS = 'id, organization_id, email, role_id, invited_by, expires_at, accepted_at, revoked_at, created_at';
// invitation_token excluded — security token; enables unauthorized invitation acceptance

const ORG_ACCESS_REQUEST_COLS = 'id, organization_id, profile_id, requested_role_id, reason, status, reviewed_by, reviewed_at, created_at';

const TRUSTED_DEVICE_COLS = 'id, profile_id, device_name, last_seen_at, created_at';
// device_fingerprint excluded — browser fingerprint; enables cross-session tracking
// attestation_data excluded — WebAuthn attestation; internal security verification
// risk_score excluded — NEVER (device risk scoring signal; enables gaming)

const SERVICE_ACCOUNT_COLS = 'id, organization_id, name, client_id, permissions, is_active, expires_at, created_at';
// client_secret_hash excluded — ABSOLUTE NEVER (service account credential hash)

// ── v13.3 Row types ───────────────────────────────────────────────────────

type OrgRoleRow = { id: string; organization_id: string; name: string; description: string | null; is_system_role: boolean; created_at: string; };
type OrgPermissionRow = { id: string; code: string; description: string | null; created_at: string; };
type OrgRolePermissionRow = { id: string; role_id: string; permission_id: string; };
type OrgMemberRoleRow = { id: string; member_id: string; role_id: string; };
type OrgInvitationRow = { id: string; organization_id: string; email: string; role_id: string | null; invited_by: string | null; expires_at: string; accepted_at: string | null; revoked_at: string | null; created_at: string; };
type OrgAccessRequestRow = { id: string; organization_id: string; profile_id: string; requested_role_id: string | null; reason: string | null; status: string; reviewed_by: string | null; reviewed_at: string | null; created_at: string; };
type TrustedDeviceRow = { id: string; profile_id: string; device_name: string | null; last_seen_at: string; created_at: string; };
type ServiceAccountRow = { id: string; organization_id: string; name: string; client_id: string; permissions: string[]; is_active: boolean; expires_at: string | null; created_at: string; };

// ── v13.3 Mappers ─────────────────────────────────────────────────────────

const mapOrgRole = (r: OrgRoleRow): OrganizationRole => ({ id: r.id, organizationId: r.organization_id, name: r.name, description: r.description, isSystemRole: r.is_system_role, createdAt: r.created_at });
const mapOrgPermission = (r: OrgPermissionRow): OrganizationPermission => ({ id: r.id, code: r.code, description: r.description, createdAt: r.created_at });
const mapOrgRolePermission = (r: OrgRolePermissionRow): OrganizationRolePermission => ({ id: r.id, roleId: r.role_id, permissionId: r.permission_id });
const mapOrgMemberRole = (r: OrgMemberRoleRow): OrganizationMemberRole => ({ id: r.id, memberId: r.member_id, roleId: r.role_id });
const mapOrgInvitation = (r: OrgInvitationRow): OrganizationInvitation => ({ id: r.id, organizationId: r.organization_id, email: r.email, roleId: r.role_id, invitedBy: r.invited_by, expiresAt: r.expires_at, acceptedAt: r.accepted_at, revokedAt: r.revoked_at, createdAt: r.created_at });
const mapOrgAccessRequest = (r: OrgAccessRequestRow): OrganizationAccessRequest => ({ id: r.id, organizationId: r.organization_id, profileId: r.profile_id, requestedRoleId: r.requested_role_id, reason: r.reason, status: r.status, reviewedBy: r.reviewed_by, reviewedAt: r.reviewed_at, createdAt: r.created_at });
const mapTrustedDevice = (r: TrustedDeviceRow): UserTrustedDevice => ({ id: r.id, profileId: r.profile_id, deviceName: r.device_name, lastSeenAt: r.last_seen_at, createdAt: r.created_at });
const mapServiceAccount = (r: ServiceAccountRow): OrganizationServiceAccount => ({ id: r.id, organizationId: r.organization_id, name: r.name, clientId: r.client_id, permissions: r.permissions, isActive: r.is_active, expiresAt: r.expires_at, createdAt: r.created_at });

// ── Organization Roles ────────────────────────────────────────────────────

export async function getOrgRoles(organizationId: string): Promise<OrganizationRole[]> {
  const { data, error } = await supabase.from('organization_roles').select(ORG_ROLE_COLS).eq('organization_id', organizationId).order('name');
  if (error) throw error;
  return (data as unknown as OrgRoleRow[]).map(mapOrgRole);
}

export async function getOrgRole(id: string): Promise<OrganizationRole | null> {
  const { data, error } = await supabase.from('organization_roles').select(ORG_ROLE_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapOrgRole(data as unknown as OrgRoleRow) : null;
}

export async function getSystemRoles(organizationId: string): Promise<OrganizationRole[]> {
  const { data, error } = await supabase.from('organization_roles').select(ORG_ROLE_COLS).eq('organization_id', organizationId).eq('is_system_role', true).order('name');
  if (error) throw error;
  return (data as unknown as OrgRoleRow[]).map(mapOrgRole);
}

// ── Organization Permissions ──────────────────────────────────────────────

export async function getOrgPermissions(): Promise<OrganizationPermission[]> {
  const { data, error } = await supabase.from('organization_permissions').select(ORG_PERMISSION_COLS).order('code');
  if (error) throw error;
  return (data as unknown as OrgPermissionRow[]).map(mapOrgPermission);
}

export async function getOrgPermission(id: string): Promise<OrganizationPermission | null> {
  const { data, error } = await supabase.from('organization_permissions').select(ORG_PERMISSION_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapOrgPermission(data as unknown as OrgPermissionRow) : null;
}

// ── Organization Role–Permission Bindings ─────────────────────────────────

export async function getRolePermissionBindings(roleId: string): Promise<OrganizationRolePermission[]> {
  const { data, error } = await supabase.from('organization_role_permissions').select(ORG_ROLE_PERMISSION_COLS).eq('role_id', roleId);
  if (error) throw error;
  return (data as unknown as OrgRolePermissionRow[]).map(mapOrgRolePermission);
}

// ── Organization Member Roles ─────────────────────────────────────────────

export async function getMemberRoles(memberId: string): Promise<OrganizationMemberRole[]> {
  const { data, error } = await supabase.from('organization_member_roles').select(ORG_MEMBER_ROLE_COLS).eq('member_id', memberId);
  if (error) throw error;
  return (data as unknown as OrgMemberRoleRow[]).map(mapOrgMemberRole);
}

// ── Organization Invitations ──────────────────────────────────────────────

export async function getOrgInvitations(organizationId: string, options: { acceptedOnly?: boolean; pendingOnly?: boolean; limit?: number } = {}): Promise<OrganizationInvitation[]> {
  let q = supabase.from('organization_invitations').select(ORG_INVITATION_COLS).eq('organization_id', organizationId);
  if (options.pendingOnly) q = q.is('accepted_at', null).is('revoked_at', null).gt('expires_at', new Date().toISOString());
  if (options.acceptedOnly) q = q.not('accepted_at', 'is', null);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as unknown as OrgInvitationRow[]).map(mapOrgInvitation);
}

export async function getPendingInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
  return getOrgInvitations(organizationId, { pendingOnly: true });
}

export async function getMyInvitations(email: string): Promise<OrganizationInvitation[]> {
  // RLS enforces that the calling user's email matches; email param drives the filter
  const { data, error } = await supabase.from('organization_invitations').select(ORG_INVITATION_COLS).eq('email', email).is('accepted_at', null).is('revoked_at', null).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as OrgInvitationRow[]).map(mapOrgInvitation);
}

// ── Organization Access Requests ──────────────────────────────────────────

export async function getOrgAccessRequests(organizationId: string, options: { status?: string; limit?: number } = {}): Promise<OrganizationAccessRequest[]> {
  let q = supabase.from('organization_access_requests').select(ORG_ACCESS_REQUEST_COLS).eq('organization_id', organizationId);
  if (options.status) q = q.eq('status', options.status);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as unknown as OrgAccessRequestRow[]).map(mapOrgAccessRequest);
}

export async function getPendingAccessRequests(organizationId: string): Promise<OrganizationAccessRequest[]> {
  return getOrgAccessRequests(organizationId, { status: 'pending' });
}

export async function getMyAccessRequests(): Promise<OrganizationAccessRequest[]> {
  // RLS filters to the current user's profile_id
  const { data, error } = await supabase.from('organization_access_requests').select(ORG_ACCESS_REQUEST_COLS).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as OrgAccessRequestRow[]).map(mapOrgAccessRequest);
}

// ── User Trusted Devices ──────────────────────────────────────────────────

export async function getMyTrustedDevices(): Promise<UserTrustedDevice[]> {
  // RLS filters to the current user's profile_id
  const { data, error } = await supabase.from('user_trusted_devices').select(TRUSTED_DEVICE_COLS).order('last_seen_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as TrustedDeviceRow[]).map(mapTrustedDevice);
}

export async function getTrustedDevice(id: string): Promise<UserTrustedDevice | null> {
  const { data, error } = await supabase.from('user_trusted_devices').select(TRUSTED_DEVICE_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapTrustedDevice(data as unknown as TrustedDeviceRow) : null;
}

// ── Organization Service Accounts ─────────────────────────────────────────

export async function getOrgServiceAccounts(organizationId: string): Promise<OrganizationServiceAccount[]> {
  const { data, error } = await supabase.from('organization_service_accounts').select(SERVICE_ACCOUNT_COLS).eq('organization_id', organizationId).order('name');
  if (error) throw error;
  return (data as unknown as ServiceAccountRow[]).map(mapServiceAccount);
}

export async function getActiveServiceAccounts(organizationId: string): Promise<OrganizationServiceAccount[]> {
  const { data, error } = await supabase.from('organization_service_accounts').select(SERVICE_ACCOUNT_COLS).eq('organization_id', organizationId).eq('is_active', true).order('name');
  if (error) throw error;
  return (data as unknown as ServiceAccountRow[]).map(mapServiceAccount);
}

export async function getServiceAccount(id: string): Promise<OrganizationServiceAccount | null> {
  const { data, error } = await supabase.from('organization_service_accounts').select(SERVICE_ACCOUNT_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapServiceAccount(data as unknown as ServiceAccountRow) : null;
}
