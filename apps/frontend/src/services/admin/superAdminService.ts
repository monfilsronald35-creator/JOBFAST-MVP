import { supabase } from '../../lib/supabase';
import type {
  EnterpriseTenant,
  GeopoliticalCountry,
  CurrencySettlement,
  InfrastructureNode,
  AiModelOrchestration,
  AdminGlobalUser,
  AdminLanguage,
  AdminBillingTransaction,
  SystemMonitoringEvent,
  DeploymentRelease,
  FeatureFlag,
  AiTrainingJob,
  EnterprisePermission,
  EnterpriseCurrencyRate,
  GeoComplianceEntry,
} from '../../types/superAdmin';

// Phase 17 — Global Enterprise Super Admin OS
//
// Backend-only tables (zero functions here):
//   super_admin_zero_trust_rbac       — cryptographic_biometric_hash = ABSOLUTE NEVER;
//                                       permissions_vector(512) = NEVER (HNSW server-side only);
//                                       explicit_privileges_json = NEVER (privilege escalation surface)
//   super_admin_defcon_security_vault — source_inet_address = NEVER (PII); anomaly_detection_payload
//                                       = NEVER (detection evasion surface); always BACKEND ONLY
//   super_admin_immutable_audit_ledger — cryptographic_hash_signature + previous_block_hash =
//                                       ledger integrity hashes; payload_snapshot_json = NEVER;
//                                       immutable audit ledger: BACKEND ONLY
//   system_global_configuration       — config_value may contain credentials and secrets: BACKEND ONLY
//   disaster_recovery_plans           — execution_steps_json reveals DR playbook: BACKEND ONLY
//   backup_snapshots                  — snapshot_identifier + storage_provider reveal infra topology: BACKEND ONLY
//   failover_events                   — incident_report = NEVER; regions reveal infra topology: BACKEND ONLY
//   database_registry                 — connection_endpoint = ABSOLUTE NEVER: BACKEND ONLY

// ── Column constants ───────────────────────────────────────────────────────

const TENANT_COLS = 'id, tenant_name, tenant_slug, sovereignty_tier, operational_status, sovereign_node_region, created_at, updated_at';
// hq_geolocation_point excluded — PostGIS GEOMETRY; not JSON-serializable
// encryption_config excluded — reveals cipher suite and key rotation config
// tenant_metrics_payload excluded — reveals compute node count and throughput capacity

const GEOPOLITICAL_COLS = 'id, iso_country_code_alpha2, iso_country_code_alpha3, country_official_name, expansion_phase_status, sovereign_currency_code, supported_languages_array, updated_at';
// dynamic_tax_engine_payload excluded — reveals internal pricing/tariff strategy
// geospatial_polygon_boundary excluded — PostGIS GEOMETRY; not JSON-serializable

const CURRENCY_COLS = 'id, currency_code, currency_classification, is_global_settlement_active, realtime_exchange_rate_to_usd, supported_gateways, updated_at';
// liquidity_pool_depth_usd excluded — reveals internal treasury depth

const INFRA_NODE_COLS = 'id, node_role, node_health_status, geographic_datacenter_zone, last_quantum_heartbeat_at';
// cluster_node_uuid excluded — reveals server instance topology
// telemetry_metrics_json excluded — reveals CPU/memory/throughput capacity
// autonomous_mitigation_actions_taken excluded — reveals security countermeasures

const AI_ORCHESTRATION_COLS = 'id, model_identifier, model_architecture_type, deployment_cluster_state, updated_at';
// allocated_gpu_tensor_cores excluded — reveals GPU capacity allocation
// performance_benchmarks_json excluded — reveals capacity internals
// auto_scaling_rules_payload excluded — internal autoscaling configuration

const GLOBAL_USER_COLS = 'id, user_id, identity_verification_status, is_banned, updated_at';
// risk_score excluded — NEVER (AI behavioral scoring signal; enables gaming)
// ban_reason excluded — internal admin moderation notes
// identity_documents_payload excluded — ABSOLUTE NEVER (KYC PII)

const LANGUAGE_COLS = 'id, language_code, language_name, country_support, translation_status, ai_translation_enabled, updated_at';
// localization_payload excluded — JSONB with no type contract

const BILLING_COLS = 'id, tenant_id, user_id, transaction_type, amount, currency_code, billing_status, gateway_reference_id, created_at';
// metadata excluded — JSONB with no type contract

const MONITORING_COLS = 'id, event_severity, service_name, latency_ms, occurred_at';
// error_message excluded — may contain stack traces and internal error details
// endpoint_path excluded — reveals internal API routing structure
// payload excluded — arbitrary JSONB; may contain sensitive data

const DEPLOYMENT_COLS = 'id, version_tag, target_environment, deployment_status, deployed_by_admin_id, release_notes, deployed_at';
// git_commit_hash excluded — reveals internal commit history; aids exploitation of known-vulnerable versions

const FEATURE_FLAG_COLS = 'id, flag_name, is_globally_enabled, rollout_percentage, description, updated_at';
// target_rules_json excluded — A/B testing cohort config; reveals user segmentation logic

const TRAINING_JOB_COLS = 'id, model_job_name, base_model_identifier, training_status, validation_accuracy, trained_at, created_at';
// training_dataset_uri excluded — reveals internal storage paths
// hyperparameters_json excluded — reveals training configuration and architecture strategy

// ── Row types ─────────────────────────────────────────────────────────────

type TenantRow = { id: string; tenant_name: string; tenant_slug: string; sovereignty_tier: string; operational_status: string; sovereign_node_region: string; created_at: string; updated_at: string; };
type GeopoliticalRow = { id: string; iso_country_code_alpha2: string; iso_country_code_alpha3: string; country_official_name: string; expansion_phase_status: string; sovereign_currency_code: string; supported_languages_array: string[]; updated_at: string; };
type CurrencyRow = { id: string; currency_code: string; currency_classification: string; is_global_settlement_active: boolean; realtime_exchange_rate_to_usd: number; supported_gateways: string[]; updated_at: string; };
type InfraNodeRow = { id: string; node_role: string; node_health_status: string; geographic_datacenter_zone: string; last_quantum_heartbeat_at: string; };
type AiOrchestrationRow = { id: string; model_identifier: string; model_architecture_type: string; deployment_cluster_state: string; updated_at: string; };
type GlobalUserRow = { id: string; user_id: string; identity_verification_status: string; is_banned: boolean; updated_at: string; };
type LanguageRow = { id: string; language_code: string; language_name: string; country_support: string[]; translation_status: string; ai_translation_enabled: boolean; updated_at: string; };
type BillingRow = { id: string; tenant_id: string | null; user_id: string | null; transaction_type: string; amount: number; currency_code: string; billing_status: string; gateway_reference_id: string | null; created_at: string; };
type MonitoringRow = { id: string; event_severity: string; service_name: string; latency_ms: number; occurred_at: string; };
type DeploymentRow = { id: string; version_tag: string; target_environment: string; deployment_status: string; deployed_by_admin_id: string | null; release_notes: string | null; deployed_at: string; };
type FeatureFlagRow = { id: string; flag_name: string; is_globally_enabled: boolean; rollout_percentage: number; description: string | null; updated_at: string; };
type TrainingJobRow = { id: string; model_job_name: string; base_model_identifier: string; training_status: string; validation_accuracy: number; trained_at: string | null; created_at: string; };

// ── Mappers ───────────────────────────────────────────────────────────────

const mapTenant = (r: TenantRow): EnterpriseTenant => ({ id: r.id, tenantName: r.tenant_name, tenantSlug: r.tenant_slug, sovereigntyTier: r.sovereignty_tier, operationalStatus: r.operational_status, sovereignNodeRegion: r.sovereign_node_region, createdAt: r.created_at, updatedAt: r.updated_at });
const mapGeopolitical = (r: GeopoliticalRow): GeopoliticalCountry => ({ id: r.id, isoCountryCodeAlpha2: r.iso_country_code_alpha2, isoCountryCodeAlpha3: r.iso_country_code_alpha3, countryOfficialName: r.country_official_name, expansionPhaseStatus: r.expansion_phase_status, sovereignCurrencyCode: r.sovereign_currency_code, supportedLanguagesArray: r.supported_languages_array, updatedAt: r.updated_at });
const mapCurrency = (r: CurrencyRow): CurrencySettlement => ({ id: r.id, currencyCode: r.currency_code, currencyClassification: r.currency_classification, isGlobalSettlementActive: r.is_global_settlement_active, realtimeExchangeRateToUsd: r.realtime_exchange_rate_to_usd, supportedGateways: r.supported_gateways, updatedAt: r.updated_at });
const mapInfraNode = (r: InfraNodeRow): InfrastructureNode => ({ id: r.id, nodeRole: r.node_role, nodeHealthStatus: r.node_health_status, geographicDatacenterZone: r.geographic_datacenter_zone, lastQuantumHeartbeatAt: r.last_quantum_heartbeat_at });
const mapAiOrchestration = (r: AiOrchestrationRow): AiModelOrchestration => ({ id: r.id, modelIdentifier: r.model_identifier, modelArchitectureType: r.model_architecture_type, deploymentClusterState: r.deployment_cluster_state, updatedAt: r.updated_at });
const mapGlobalUser = (r: GlobalUserRow): AdminGlobalUser => ({ id: r.id, userId: r.user_id, identityVerificationStatus: r.identity_verification_status, isBanned: r.is_banned, updatedAt: r.updated_at });
const mapLanguage = (r: LanguageRow): AdminLanguage => ({ id: r.id, languageCode: r.language_code, languageName: r.language_name, countrySupport: r.country_support, translationStatus: r.translation_status, aiTranslationEnabled: r.ai_translation_enabled, updatedAt: r.updated_at });
const mapBilling = (r: BillingRow): AdminBillingTransaction => ({ id: r.id, tenantId: r.tenant_id, userId: r.user_id, transactionType: r.transaction_type, amount: r.amount, currencyCode: r.currency_code, billingStatus: r.billing_status, gatewayReferenceId: r.gateway_reference_id, createdAt: r.created_at });
const mapMonitoring = (r: MonitoringRow): SystemMonitoringEvent => ({ id: r.id, eventSeverity: r.event_severity, serviceName: r.service_name, latencyMs: r.latency_ms, occurredAt: r.occurred_at });
const mapDeployment = (r: DeploymentRow): DeploymentRelease => ({ id: r.id, versionTag: r.version_tag, targetEnvironment: r.target_environment, deploymentStatus: r.deployment_status, deployedByAdminId: r.deployed_by_admin_id, releaseNotes: r.release_notes, deployedAt: r.deployed_at });
const mapFeatureFlag = (r: FeatureFlagRow): FeatureFlag => ({ id: r.id, flagName: r.flag_name, isGloballyEnabled: r.is_globally_enabled, rolloutPercentage: r.rollout_percentage, description: r.description, updatedAt: r.updated_at });
const mapTrainingJob = (r: TrainingJobRow): AiTrainingJob => ({ id: r.id, modelJobName: r.model_job_name, baseModelIdentifier: r.base_model_identifier, trainingStatus: r.training_status, validationAccuracy: r.validation_accuracy, trainedAt: r.trained_at, createdAt: r.created_at });

// ── Enterprise Tenants ────────────────────────────────────────────────────

export async function getTenants(options: { status?: string; sovereigntyTier?: string } = {}): Promise<EnterpriseTenant[]> {
  let q = supabase.from('enterprise_tenants').select(TENANT_COLS);
  if (options.status) q = q.eq('operational_status', options.status);
  if (options.sovereigntyTier) q = q.eq('sovereignty_tier', options.sovereigntyTier);
  const { data, error } = await q.order('tenant_name');
  if (error) throw error;
  return (data as unknown as TenantRow[]).map(mapTenant);
}

export async function getTenant(id: string): Promise<EnterpriseTenant | null> {
  const { data, error } = await supabase.from('enterprise_tenants').select(TENANT_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapTenant(data as unknown as TenantRow) : null;
}

export async function getTenantBySlug(slug: string): Promise<EnterpriseTenant | null> {
  // UNIQUE (tenant_slug)
  const { data, error } = await supabase.from('enterprise_tenants').select(TENANT_COLS).eq('tenant_slug', slug).maybeSingle();
  if (error) throw error;
  return data ? mapTenant(data as unknown as TenantRow) : null;
}

// ── Geopolitical Expansion Matrix ─────────────────────────────────────────

export async function getExpansionCountries(options: { status?: string } = {}): Promise<GeopoliticalCountry[]> {
  let q = supabase.from('super_admin_geopolitical_matrix').select(GEOPOLITICAL_COLS);
  if (options.status) q = q.eq('expansion_phase_status', options.status);
  const { data, error } = await q.order('country_official_name');
  if (error) throw error;
  return (data as unknown as GeopoliticalRow[]).map(mapGeopolitical);
}

export async function getExpansionCountry(alpha2: string): Promise<GeopoliticalCountry | null> {
  // UNIQUE (iso_country_code_alpha2)
  const { data, error } = await supabase.from('super_admin_geopolitical_matrix').select(GEOPOLITICAL_COLS).eq('iso_country_code_alpha2', alpha2.toUpperCase()).maybeSingle();
  if (error) throw error;
  return data ? mapGeopolitical(data as unknown as GeopoliticalRow) : null;
}

// ── Currency Settlements ──────────────────────────────────────────────────

export async function getCurrencySettlements(activeOnly = true): Promise<CurrencySettlement[]> {
  let q = supabase.from('super_admin_currency_settlements').select(CURRENCY_COLS);
  if (activeOnly) q = q.eq('is_global_settlement_active', true);
  const { data, error } = await q.order('currency_code');
  if (error) throw error;
  return (data as unknown as CurrencyRow[]).map(mapCurrency);
}

export async function getCurrencySettlement(currencyCode: string): Promise<CurrencySettlement | null> {
  // UNIQUE (currency_code)
  const { data, error } = await supabase.from('super_admin_currency_settlements').select(CURRENCY_COLS).eq('currency_code', currencyCode.toUpperCase()).maybeSingle();
  if (error) throw error;
  return data ? mapCurrency(data as unknown as CurrencyRow) : null;
}

// ── Infrastructure Mesh ───────────────────────────────────────────────────

export async function getInfrastructureNodes(options: { role?: string; status?: string } = {}): Promise<InfrastructureNode[]> {
  let q = supabase.from('super_admin_neural_infrastructure_mesh').select(INFRA_NODE_COLS);
  if (options.role) q = q.eq('node_role', options.role);
  if (options.status) q = q.eq('node_health_status', options.status);
  const { data, error } = await q.order('geographic_datacenter_zone').order('node_role');
  if (error) throw error;
  return (data as unknown as InfraNodeRow[]).map(mapInfraNode);
}

export async function getDegradedNodes(): Promise<InfrastructureNode[]> {
  const { data, error } = await supabase.from('super_admin_neural_infrastructure_mesh').select(INFRA_NODE_COLS).in('node_health_status', ['degraded', 'offline']).order('last_quantum_heartbeat_at', { ascending: true });
  if (error) throw error;
  return (data as unknown as InfraNodeRow[]).map(mapInfraNode);
}

// ── AI Model Orchestration ────────────────────────────────────────────────

export async function getAiOrchestrations(options: { architectureType?: string; state?: string } = {}): Promise<AiModelOrchestration[]> {
  let q = supabase.from('super_admin_ai_model_orchestration').select(AI_ORCHESTRATION_COLS);
  if (options.architectureType) q = q.eq('model_architecture_type', options.architectureType);
  if (options.state) q = q.eq('deployment_cluster_state', options.state);
  const { data, error } = await q.order('model_identifier');
  if (error) throw error;
  return (data as unknown as AiOrchestrationRow[]).map(mapAiOrchestration);
}

export async function getAiOrchestration(id: string): Promise<AiModelOrchestration | null> {
  const { data, error } = await supabase.from('super_admin_ai_model_orchestration').select(AI_ORCHESTRATION_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapAiOrchestration(data as unknown as AiOrchestrationRow) : null;
}

// ── Global Users Management ───────────────────────────────────────────────

export async function getGlobalUser(userId: string): Promise<AdminGlobalUser | null> {
  // UNIQUE per user_id — RLS does NOT apply; super admin context
  const { data, error } = await supabase.from('super_admin_global_users').select(GLOBAL_USER_COLS).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data ? mapGlobalUser(data as unknown as GlobalUserRow) : null;
}

export async function getUnverifiedUsers(options: { limit?: number } = {}): Promise<AdminGlobalUser[]> {
  const { data, error } = await supabase.from('super_admin_global_users').select(GLOBAL_USER_COLS).eq('identity_verification_status', 'unverified').eq('is_banned', false).order('updated_at', { ascending: true }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as unknown as GlobalUserRow[]).map(mapGlobalUser);
}

export async function getPendingVerificationUsers(options: { limit?: number } = {}): Promise<AdminGlobalUser[]> {
  const { data, error } = await supabase.from('super_admin_global_users').select(GLOBAL_USER_COLS).eq('identity_verification_status', 'pending').order('updated_at', { ascending: true }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as unknown as GlobalUserRow[]).map(mapGlobalUser);
}

export async function getBannedUsers(options: { limit?: number } = {}): Promise<AdminGlobalUser[]> {
  const { data, error } = await supabase.from('super_admin_global_users').select(GLOBAL_USER_COLS).eq('is_banned', true).order('updated_at', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as unknown as GlobalUserRow[]).map(mapGlobalUser);
}

// ── Languages Management ──────────────────────────────────────────────────

export async function getAdminLanguages(options: { status?: string; aiEnabled?: boolean } = {}): Promise<AdminLanguage[]> {
  let q = supabase.from('super_admin_languages').select(LANGUAGE_COLS);
  if (options.status) q = q.eq('translation_status', options.status);
  if (options.aiEnabled !== undefined) q = q.eq('ai_translation_enabled', options.aiEnabled);
  const { data, error } = await q.order('language_name');
  if (error) throw error;
  return (data as unknown as LanguageRow[]).map(mapLanguage);
}

export async function getAdminLanguage(languageCode: string): Promise<AdminLanguage | null> {
  // UNIQUE (language_code)
  const { data, error } = await supabase.from('super_admin_languages').select(LANGUAGE_COLS).eq('language_code', languageCode).maybeSingle();
  if (error) throw error;
  return data ? mapLanguage(data as unknown as LanguageRow) : null;
}

// ── Billing Control ───────────────────────────────────────────────────────

export async function getBillingTransactions(options: { transactionType?: string; status?: string; from?: string; to?: string; limit?: number } = {}): Promise<AdminBillingTransaction[]> {
  let q = supabase.from('super_admin_billing_control').select(BILLING_COLS);
  if (options.transactionType) q = q.eq('transaction_type', options.transactionType);
  if (options.status) q = q.eq('billing_status', options.status);
  if (options.from) q = q.gte('created_at', options.from);
  if (options.to) q = q.lte('created_at', options.to);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as unknown as BillingRow[]).map(mapBilling);
}

export async function getTenantBillingTransactions(tenantId: string, options: { limit?: number } = {}): Promise<AdminBillingTransaction[]> {
  const { data, error } = await supabase.from('super_admin_billing_control').select(BILLING_COLS).eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as unknown as BillingRow[]).map(mapBilling);
}

export async function getUserBillingTransactions(userId: string, options: { limit?: number } = {}): Promise<AdminBillingTransaction[]> {
  const { data, error } = await supabase.from('super_admin_billing_control').select(BILLING_COLS).eq('user_id', userId).order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as unknown as BillingRow[]).map(mapBilling);
}

// ── System Monitoring Events ──────────────────────────────────────────────

export async function getMonitoringEvents(options: { severity?: string; serviceName?: string; from?: string; limit?: number } = {}): Promise<SystemMonitoringEvent[]> {
  let q = supabase.from('system_monitoring_events').select(MONITORING_COLS);
  if (options.severity) q = q.eq('event_severity', options.severity);
  if (options.serviceName) q = q.eq('service_name', options.serviceName);
  if (options.from) q = q.gte('occurred_at', options.from);
  const { data, error } = await q.order('occurred_at', { ascending: false }).limit(options.limit ?? 200);
  if (error) throw error;
  return (data as unknown as MonitoringRow[]).map(mapMonitoring);
}

export async function getCriticalEvents(options: { limit?: number } = {}): Promise<SystemMonitoringEvent[]> {
  const { data, error } = await supabase.from('system_monitoring_events').select(MONITORING_COLS).in('event_severity', ['error', 'critical']).order('occurred_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as unknown as MonitoringRow[]).map(mapMonitoring);
}

// ── Deployment Releases ───────────────────────────────────────────────────

export async function getDeploymentReleases(options: { environment?: string; status?: string; limit?: number } = {}): Promise<DeploymentRelease[]> {
  let q = supabase.from('deployment_releases').select(DEPLOYMENT_COLS);
  if (options.environment) q = q.eq('target_environment', options.environment);
  if (options.status) q = q.eq('deployment_status', options.status);
  const { data, error } = await q.order('deployed_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as unknown as DeploymentRow[]).map(mapDeployment);
}

export async function getLatestDeployment(environment: string): Promise<DeploymentRelease | null> {
  const { data, error } = await supabase.from('deployment_releases').select(DEPLOYMENT_COLS).eq('target_environment', environment).eq('deployment_status', 'deployed').order('deployed_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? mapDeployment(data as unknown as DeploymentRow) : null;
}

export async function getDeployment(id: string): Promise<DeploymentRelease | null> {
  const { data, error } = await supabase.from('deployment_releases').select(DEPLOYMENT_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapDeployment(data as unknown as DeploymentRow) : null;
}

// ── Feature Flags ─────────────────────────────────────────────────────────

export async function getGlobalFeatureFlags(options: { enabledOnly?: boolean } = {}): Promise<FeatureFlag[]> {
  let q = supabase.from('feature_flags').select(FEATURE_FLAG_COLS);
  if (options.enabledOnly) q = q.eq('is_globally_enabled', true);
  const { data, error } = await q.order('flag_name');
  if (error) throw error;
  return (data as unknown as FeatureFlagRow[]).map(mapFeatureFlag);
}

export async function getGlobalFeatureFlag(flagName: string): Promise<FeatureFlag | null> {
  // UNIQUE (flag_name)
  const { data, error } = await supabase.from('feature_flags').select(FEATURE_FLAG_COLS).eq('flag_name', flagName).maybeSingle();
  if (error) throw error;
  return data ? mapFeatureFlag(data as unknown as FeatureFlagRow) : null;
}

export async function getActiveFeatureFlags(): Promise<FeatureFlag[]> {
  const { data, error } = await supabase.from('feature_flags').select(FEATURE_FLAG_COLS).eq('is_globally_enabled', true).gt('rollout_percentage', 0).order('flag_name');
  if (error) throw error;
  return (data as unknown as FeatureFlagRow[]).map(mapFeatureFlag);
}

// ── AI Training Management ────────────────────────────────────────────────

export async function getAiTrainingJobs(options: { status?: string; limit?: number } = {}): Promise<AiTrainingJob[]> {
  let q = supabase.from('ai_training_management').select(TRAINING_JOB_COLS);
  if (options.status) q = q.eq('training_status', options.status);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as unknown as TrainingJobRow[]).map(mapTrainingJob);
}

export async function getAiTrainingJob(id: string): Promise<AiTrainingJob | null> {
  const { data, error } = await supabase.from('ai_training_management').select(TRAINING_JOB_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapTrainingJob(data as unknown as TrainingJobRow) : null;
}

export async function getCompletedTrainingJobs(options: { minAccuracy?: number; limit?: number } = {}): Promise<AiTrainingJob[]> {
  let q = supabase.from('ai_training_management').select(TRAINING_JOB_COLS).eq('training_status', 'completed');
  if (options.minAccuracy !== undefined) q = q.gte('validation_accuracy', options.minAccuracy);
  const { data, error } = await q.order('trained_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as unknown as TrainingJobRow[]).map(mapTrainingJob);
}

// ── Migration 030: RBAC Permissions, Currency Rates & Geo Compliance ──────
//
// Backend-only (zero functions here):
//   enterprise_active_sessions_telemetry — client_ip = NEVER (PII); device_fingerprint_hash
//     = excluded; refresh_token_id = ABSOLUTE NEVER; risk_multiplier = excluded (AI scoring);
//     is_flagged_suspicious = excluded (anomaly gaming); last_location = PII; BACKEND ONLY
//   enterprise_global_operations_view    — REVOKE ALL from authenticated: BACKEND ONLY
//   evaluate_sovereign_abac_access       — PL/pgSQL SECURITY DEFINER function: backend only
//   execute_global_escrow_transfer       — GRANT TO service_role only: backend only

const ENTERPRISE_PERMISSION_COLS = 'permission_code, domain_scope, description, created_at';

const CURRENCY_RATE_COLS = 'currency_code, rate_to_usd, updated_at';

const GEO_COMPLIANCE_COLS = 'id, country_iso_code, is_sanctioned, requires_strict_kyc, allowed_payment_gateways, updated_at';

type EnterprisePermissionRow = { permission_code: string; domain_scope: string; description: string | null; created_at: string; };
type CurrencyRateRow = { currency_code: string; rate_to_usd: number; updated_at: string; };
type GeoComplianceRow = { id: string; country_iso_code: string; is_sanctioned: boolean; requires_strict_kyc: boolean; allowed_payment_gateways: string[]; updated_at: string; };

const mapEnterprisePermission = (r: EnterprisePermissionRow): EnterprisePermission => ({ permissionCode: r.permission_code, domainScope: r.domain_scope, description: r.description, createdAt: r.created_at });
const mapCurrencyRate = (r: CurrencyRateRow): EnterpriseCurrencyRate => ({ currencyCode: r.currency_code, rateToUsd: r.rate_to_usd, updatedAt: r.updated_at });
const mapGeoCompliance = (r: GeoComplianceRow): GeoComplianceEntry => ({ id: r.id, countryIsoCode: r.country_iso_code, isSanctioned: r.is_sanctioned, requiresStrictKyc: r.requires_strict_kyc, allowedPaymentGateways: r.allowed_payment_gateways, updatedAt: r.updated_at });

// ── Enterprise RBAC Permissions Catalog ──────────────────────────────────

export async function getEnterprisePermissions(options: { domainScope?: string } = {}): Promise<EnterprisePermission[]> {
  let q = supabase.from('enterprise_global_permissions').select(ENTERPRISE_PERMISSION_COLS);
  if (options.domainScope) q = q.eq('domain_scope', options.domainScope);
  const { data, error } = await q.order('domain_scope').order('permission_code');
  if (error) throw error;
  return (data as unknown as EnterprisePermissionRow[]).map(mapEnterprisePermission);
}

export async function getEnterprisePermission(permissionCode: string): Promise<EnterprisePermission | null> {
  // PRIMARY KEY (permission_code)
  const { data, error } = await supabase.from('enterprise_global_permissions').select(ENTERPRISE_PERMISSION_COLS).eq('permission_code', permissionCode).maybeSingle();
  if (error) throw error;
  return data ? mapEnterprisePermission(data as unknown as EnterprisePermissionRow) : null;
}

// ── Official Currency Exchange Rates ──────────────────────────────────────

export async function getCurrencyRates(): Promise<EnterpriseCurrencyRate[]> {
  const { data, error } = await supabase.from('enterprise_currency_rates').select(CURRENCY_RATE_COLS).order('currency_code');
  if (error) throw error;
  return (data as unknown as CurrencyRateRow[]).map(mapCurrencyRate);
}

export async function getCurrencyRate(currencyCode: string): Promise<EnterpriseCurrencyRate | null> {
  // PRIMARY KEY (currency_code)
  const { data, error } = await supabase.from('enterprise_currency_rates').select(CURRENCY_RATE_COLS).eq('currency_code', currencyCode.toUpperCase()).maybeSingle();
  if (error) throw error;
  return data ? mapCurrencyRate(data as unknown as CurrencyRateRow) : null;
}

// ── Geo Compliance Registry ────────────────────────────────────────────────

export async function getGeoComplianceEntries(options: { sanctionedOnly?: boolean; strictKycOnly?: boolean } = {}): Promise<GeoComplianceEntry[]> {
  let q = supabase.from('enterprise_geo_compliance_registry').select(GEO_COMPLIANCE_COLS);
  if (options.sanctionedOnly) q = q.eq('is_sanctioned', true);
  if (options.strictKycOnly) q = q.eq('requires_strict_kyc', true);
  const { data, error } = await q.order('country_iso_code');
  if (error) throw error;
  return (data as unknown as GeoComplianceRow[]).map(mapGeoCompliance);
}

export async function getGeoComplianceEntry(countryIsoCode: string): Promise<GeoComplianceEntry | null> {
  // UNIQUE (country_iso_code)
  const { data, error } = await supabase.from('enterprise_geo_compliance_registry').select(GEO_COMPLIANCE_COLS).eq('country_iso_code', countryIsoCode.toUpperCase()).maybeSingle();
  if (error) throw error;
  return data ? mapGeoCompliance(data as unknown as GeoComplianceRow) : null;
}
