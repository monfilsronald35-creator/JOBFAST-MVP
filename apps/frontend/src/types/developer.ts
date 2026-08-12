// ── Developer Platform & Hyper-Scale Enterprise (Migrations 025–026) ─────────
//
// Backend-only tables (no frontend types):
//   api_request_logs     — ip_address = NEVER (PII); user_agent = fingerprinting PII;
//                          internal API telemetry
//   webhook_deliveries   — payload JSONB may contain PII; response_body = internal
//                          gateway data; internal retry-queue state
//   secret_vaults        — encrypted_value = ABSOLUTE NEVER; even key names reveal
//                          what secrets are stored
//   compliance_audit_logs — ip_address = NEVER (PII); audit logs always backend-only
//   distributed_locks    — internal locking mechanism; never needed by client
//   ai_event_streams     — embedding_vector(1536) = NEVER (~12KB per row; HNSW server-only);
//                          context_payload = internal AI processing data
//   quantum_cache_nodes  — internal cache infrastructure
//   global_edge_invalidations — internal cache-invalidation queue

// ── Developer Apps ────────────────────────────────────────────────────────

export interface DeveloperApp {
  id: string;
  userId: string | null;
  name: string;
  slug: string;
  description: string | null;
  clientId: string;
  // client_secret_hash excluded — ABSOLUTE NEVER (OAuth2 client secret hash;
  // even hash exposure enables offline brute-force attacks against the secret)
  redirectUris: string[];
  allowedScopes: string[];
  rateLimitTier: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  // metadata excluded — JSONB with no type contract; may contain sensitive
  // internal app configuration, rate-limit overrides, or flag state
  createdAt: string;
  updatedAt: string;
}

// ── API Keys ──────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  appId: string | null;
  userId: string | null;
  name: string;
  keyPrefix: string; // short display hint, e.g. "sk_abc" — intentionally public
  // key_hash excluded — ABSOLUTE NEVER (credential hash; even partial exposure
  // enables offline comparison attacks against stolen key hashes)
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  isRevoked: boolean;
  createdAt: string;
}

// ── Webhook Endpoints ─────────────────────────────────────────────────────

export interface WebhookEndpoint {
  id: string;
  appId: string | null;
  url: string;
  // secret_key_encrypted excluded — ABSOLUTE NEVER (encrypted HMAC signing secret)
  subscribedEvents: string[];
  isActive: boolean;
  // Circuit breaker columns (added by schema extension after migration 025-026)
  circuitState: string;       // 'closed' | 'open' | 'half_open'
  consecutiveFailures: number;
  maxConsecutiveFailures: number;
  cooldownUntil: string | null;
  successRateRolling: number;
  targetRegion: string;
  timeoutMs: number;
  // headers excluded — may contain Authorization headers or API keys sent with requests
  // metadata excluded — JSONB with no type contract; may contain sensitive internal state
  createdAt: string;
  updatedAt: string;
}

// ── Organizations (Multi-Tenant IAM) ─────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  legalName: string | null;
  // tax_id excluded — NEVER (EIN/VAT equivalent)
  logoUrl: string | null;
  locale: string;
  timezone: string;
  // billing_email excluded — PII; admin contact not needed by regular members
  primaryDomain: string | null;
  domainVerifiedAt: string | null;
  // domain_verification_token excluded — security token; enables domain hijacking
  domainOwnershipStatus: string;
  allowedDomains: string[];
  ssoEnabled: boolean;
  ssoProvider: string;
  ssoIssuerUrl: string | null;
  ssoClientId: string | null;
  // sso_client_secret_encrypted excluded — ABSOLUTE NEVER (encrypted SSO client secret)
  // sso_metadata_xml excluded — NEVER (SAML metadata with certs; enables SAML forgery)
  // sso_config excluded — NEVER (full SSO credential bundle)
  // security_policies excluded — internal configuration; revealing policies aids attackers
  tier: string;
  status: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  // metadata excluded — JSONB with no type contract
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  // Schema note: migration 025-026 uses user_id (users FK); migration v13.3 uses
  // profile_id (profiles FK). Deployed column depends on which migration ran first.
  userId: string | null;
  role: string;
  permissions: string[];
  isActive: boolean;
  // Columns added by ALTER TABLE in migration v13.3 (always present post-migration):
  status: string;
  joinedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  // scim_external_id, external_tenant_id, provisioning_version excluded — internal SCIM state
  // member_risk_score excluded — NEVER (risk scoring signal; enables gaming)
  // metadata excluded — JSONB with no type contract
  createdAt: string;
}

// ── Platform Health ───────────────────────────────────────────────────────

export interface PlatformHealthReport {
  id: string;
  serviceName: string;
  status: string;
  latencyMs: number | null;
  regionCode: string | null; // added by ALTER TABLE in QSI migration (nullable on pre-existing rows)
  // metrics_snapshot excluded — internal system metrics; reveals infrastructure topology
  // node_instance_id excluded — internal cloud node identifier; reveals server instance topology
  checkedAt: string;
}

// ── API Usage Quotas ──────────────────────────────────────────────────────

export interface ApiUsageQuota {
  id: string;
  appId: string | null;
  organizationId: string | null;
  metricType: string;
  allowedLimit: number;
  currentUsage: number;
  resetAt: string;
  updatedAt: string;
}

// ── Enterprise IAM Mesh (Migration v13.3) ────────────────────────────────
//
// Backend-only tables (no frontend types):
//   user_mfa_methods — secret_or_public_key = ABSOLUTE NEVER (column holds both
//                      TOTP seeds and WebAuthn credentials; cannot be exposed)
//   user_sessions    — refresh_token_hash = ABSOLUTE NEVER (session credential hash);
//                      ip_address = NEVER (PII); user_agent = fingerprinting PII
//   audit_logs       — ip_address = NEVER (PII); user_agent = fingerprinting PII;
//                      established rule: audit logs always BACKEND ONLY

export interface OrganizationRole {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  createdAt: string;
}

export interface OrganizationPermission {
  id: string;
  code: string;
  description: string | null;
  createdAt: string;
}

export interface OrganizationRolePermission {
  id: string;
  roleId: string;
  permissionId: string;
}

export interface OrganizationMemberRole {
  id: string;
  memberId: string;
  roleId: string;
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  // invitation_token excluded — security token; enables unauthorized invitation acceptance
  // (token is delivered via email link; frontend never needs to query it)
  roleId: string | null;
  invitedBy: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface OrganizationAccessRequest {
  id: string;
  organizationId: string;
  profileId: string;
  requestedRoleId: string | null;
  reason: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface UserTrustedDevice {
  id: string;
  profileId: string;
  // device_fingerprint excluded — browser fingerprint; enables cross-session tracking
  deviceName: string | null;
  // attestation_data excluded — WebAuthn attestation object; internal security verification
  // risk_score excluded — NEVER (device risk scoring signal; enables gaming)
  lastSeenAt: string;
  createdAt: string;
}

export interface OrganizationServiceAccount {
  id: string;
  organizationId: string;
  name: string;
  clientId: string;
  // client_secret_hash excluded — ABSOLUTE NEVER (service account credential hash)
  permissions: string[];
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

// ── Enterprise Subscriptions ──────────────────────────────────────────────

export interface EnterpriseSubscription {
  id: string;
  organizationId: string;
  planCode: string;
  planName: string;
  status: string; // 'active' | 'trial' | 'auto_grace_period' | 'suspended_over_quota' | 'cancelled' | 'sovereign_lifetime'
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  autoRenew: boolean;
  usageLimits: Record<string, unknown>; // feature/quota config: max_requests, max_team_members, features_unlocked, etc.
  basePriceAmount: number;
  overageRatePerUnit: number;
  currency: string;
  // settlement_ledger_hash excluded — internal audit chain integrity hash
  // metadata excluded — JSONB with no type contract
  createdAt: string;
  updatedAt: string;
}

// ── Enterprise Invoices (Org-Level Billing) ───────────────────────────────

export interface EnterpriseInvoice {
  id: string;
  organizationId: string | null;
  stripeInvoiceId: string | null;
  amountDue: number;
  amountPaid: number;
  currency: string;
  taxAmount: number;
  status: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  invoicePdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
