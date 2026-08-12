// ── Settings & Governance Matrix (Hyper-Dimensional Singularity Core) ────
//
// Backend-only tables (no frontend types):
//   user_active_sessions — refresh_token_hash = ABSOLUTE NEVER (session credential hash);
//                          push_token = ABSOLUTE NEVER (FCM/APNs token; unauthorized push);
//                          ip_address = NEVER (PII); geo_city_name = NEVER (PII);
//                          geo_coordinates = NEVER (precise location PII);
//                          user_agent = NEVER (device fingerprinting PII);
//                          risk_score = NEVER (AI behavioral scoring; enables gaming);
//                          device_fingerprint_hash excluded (cross-session tracking)
//   system_audit_logs   — ip_address = NEVER (PII); previous_state/new_state = NEVER
//                          (arbitrary table snapshots; may contain credentials, PII, API keys);
//                          audit logs always BACKEND ONLY

// ── User Global Settings ──────────────────────────────────────────────────

export interface UserGlobalSettings {
  id: string;
  userId: string;
  localeLanguage: string;
  timezone: string;
  currencyPreference: string;
  theme: string;
  accentColor: string;
  fontScale: number;
  density: string;
  animationLevel: string;
  // JSONB preferences fields — user-controlled; well-documented defaults
  accessibilityConfig: Record<string, unknown>; // screen_reader, high_contrast, reduced_motion, haptic_feedback_intensity
  privacySettings: Record<string, unknown>;     // profile_visibility, show_online_status, discoverable_*, allow_ai_training
  notificationPreferences: Record<string, unknown>; // push_enabled, email_enabled, quiet_hours, channels by vertical
  aiPreferences: Record<string, unknown>;       // copilot_active, memory_enabled, ai_language, assistant_personality
  // metadata excluded — JSONB with no type contract
  createdAt: string;
  updatedAt: string;
}

// ── Business Settings ─────────────────────────────────────────────────────

export interface BusinessSettings {
  id: string;
  businessId: string;
  entityVersion: number;
  entityOwner: string | null;
  autoAcceptJobs: boolean;
  operationalPreferences: Record<string, unknown>;
  // tax_override_rules excluded — internal financial configuration; may reveal pricing strategy
  createdAt: string;
  updatedAt: string;
}

// ── Enterprise Settings ───────────────────────────────────────────────────

export interface EnterpriseSettings {
  id: string;
  organizationId: string;
  entityVersion: number;
  entityOwner: string | null;
  // sso_saml_config excluded — NEVER (SSO credential bundle; may contain IdP certs and client secrets)
  // scim_provisioning_config excluded — EXCLUDED (SCIM provisioning; may contain provisioning tokens)
  complianceFrameworks: string[];
  auditRetentionDays: number;
  createdAt: string;
  updatedAt: string;
}

// ── Developer Settings ────────────────────────────────────────────────────

export interface DeveloperSettings {
  id: string;
  developerUserId: string;
  entityVersion: number;
  developerModeActive: boolean;
  sandboxEnvironmentEnabled: boolean;
  apiQuotasTier: string;
  sdkPreferences: Record<string, unknown>;
  oauthConsentRegistry: Record<string, unknown>; // user's own OAuth consent grants — safe to expose to the consenting user
  // webhook_endpoints excluded — JSONB may contain endpoint secrets; use webhook_endpoints table for typed access
  createdAt: string;
  updatedAt: string;
}

// ── User Storage Metrics ──────────────────────────────────────────────────

export interface UserStorageMetrics {
  id: string;
  userId: string;
  totalAllocatedBytes: number;
  storageUsedBytes: number;
  cacheUsedBytes: number;
  offlineSyncBytes: number;
  // downloads_history excluded — JSONB with no type contract; may contain sensitive file metadata
  // exported_files_registry excluded — JSONB with no type contract; may contain content references
  updatedAt: string;
}
