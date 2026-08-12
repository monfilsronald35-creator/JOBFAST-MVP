// ── Phase 17: Global Enterprise Super Admin OS ────────────────────────────
//
// Backend-only tables (no frontend types):
//   super_admin_zero_trust_rbac       — cryptographic_biometric_hash = ABSOLUTE NEVER
//                                       (biometric credential hash; enables spoofing);
//                                       permissions_vector(512) = NEVER (ML embedding;
//                                       server-side HNSW only; ~2KB/row);
//                                       explicit_privileges_json = NEVER (full privilege
//                                       surface; enables privilege escalation attacks)
//   super_admin_defcon_security_vault — source_inet_address = NEVER (PII + reveals
//                                       attacker detection capability); anomaly_detection_payload
//                                       = NEVER (exposes detection signals; enables evasion);
//                                       autonomous_countermeasure_executed reveals response
//                                       playbook; always BACKEND ONLY (DEFCON security table)
//   super_admin_immutable_audit_ledger — cryptographic_hash_signature + previous_block_hash
//                                       = ledger chain integrity hashes (excluded per ledger
//                                       hash rule); payload_snapshot_json = NEVER (arbitrary
//                                       state snapshots across all tables); immutable ledger:
//                                       BACKEND ONLY
//   system_global_configuration       — config_value TEXT may contain API keys, secrets, or
//                                       encrypted credentials; is_encrypted = TRUE on sensitive
//                                       rows; mixed sensitivity level: always BACKEND ONLY
//   disaster_recovery_plans           — execution_steps_json reveals DR procedures and response
//                                       playbook; source/target failover regions reveal
//                                       infrastructure topology: BACKEND ONLY
//   backup_snapshots                  — snapshot_identifier reveals storage naming convention;
//                                       storage_provider exposes backup infrastructure: BACKEND ONLY
//   failover_events                   — incident_report = NEVER (reveals response procedures
//                                       and vulnerability details); regions expose topology:
//                                       BACKEND ONLY
//   database_registry                 — connection_endpoint = ABSOLUTE NEVER (direct database
//                                       connection string; exposes DB access path): BACKEND ONLY

// ── Enterprise Tenants ────────────────────────────────────────────────────

export interface EnterpriseTenant {
  id: string;
  tenantName: string;
  tenantSlug: string;
  sovereigntyTier: string; // 'enterprise' | 'government' | 'startup'
  operationalStatus: string; // 'active' | 'suspended' | 'terminated'
  sovereignNodeRegion: string;
  // hq_geolocation_point excluded — PostGIS GEOMETRY(Point, 4326); not JSON-serializable
  // encryption_config excluded — reveals cipher suite, key rotation interval, ZKP config
  // tenant_metrics_payload excluded — reveals active compute node count and throughput capacity
  createdAt: string;
  updatedAt: string;
}

// ── Geopolitical Expansion Matrix ─────────────────────────────────────────

export interface GeopoliticalCountry {
  id: string;
  isoCountryCodeAlpha2: string;
  isoCountryCodeAlpha3: string;
  countryOfficialName: string;
  expansionPhaseStatus: string; // 'active' | 'pending' | 'suspended'
  sovereignCurrencyCode: string;
  supportedLanguagesArray: string[];
  // dynamic_tax_engine_payload excluded — reveals VAT rates, cross-border tariff multipliers,
  // and automated compliance config (internal pricing strategy)
  // geospatial_polygon_boundary excluded — PostGIS GEOMETRY(MultiPolygon, 4326); not JSON-serializable
  updatedAt: string;
}

// ── Global Currency Settlements ───────────────────────────────────────────

export interface CurrencySettlement {
  id: string;
  currencyCode: string;
  currencyClassification: string; // 'fiat' | 'cbdc' | 'crypto'
  isGlobalSettlementActive: boolean;
  realtimeExchangeRateToUsd: number; // NUMERIC(24,10) — live rate; safe to display
  // liquidity_pool_depth_usd excluded — reveals internal treasury depth (sensitive financial)
  supportedGateways: string[]; // JSONB array of gateway names — safe list for UI payment routing
  updatedAt: string;
}

// ── Infrastructure Mesh (admin health dashboard) ──────────────────────────

export interface InfrastructureNode {
  id: string;
  // cluster_node_uuid excluded — internal cloud node identifier; reveals server instance topology
  nodeRole: string; // 'kubernetes_control_plane' | 'postgresql_shards' | 'gpu_ai_inference' | 'edge_relay'
  nodeHealthStatus: string; // 'optimal' | 'degraded' | 'offline'
  geographicDatacenterZone: string;
  // telemetry_metrics_json excluded — reveals CPU/memory/throughput/latency (infrastructure topology)
  // autonomous_mitigation_actions_taken excluded — reveals security countermeasures (evasion surface)
  lastQuantumHeartbeatAt: string;
}

// ── AI Model Orchestration ────────────────────────────────────────────────

export interface AiModelOrchestration {
  id: string;
  modelIdentifier: string;
  modelArchitectureType: string; // 'transformer_llm' | 'diffusion_engine' | 'neural_net' | 'agent'
  deploymentClusterState: string; // 'active_serving' | 'scaling' | 'stopped'
  // allocated_gpu_tensor_cores excluded — reveals GPU capacity allocation (infrastructure topology)
  // performance_benchmarks_json excluded — reveals tokens/sec, latency, accuracy (capacity internals)
  // auto_scaling_rules_payload excluded — JSONB; internal autoscaling configuration
  updatedAt: string;
}

// ── Global Users Management (admin view) ──────────────────────────────────

export interface AdminGlobalUser {
  id: string;
  userId: string;
  identityVerificationStatus: string; // 'unverified' | 'pending' | 'verified' | 'rejected'
  // risk_score excluded — NEVER (AI behavioral scoring signal; enables gaming)
  isBanned: boolean;
  // ban_reason excluded — internal admin moderation notes; reveals moderation criteria
  // identity_documents_payload excluded — ABSOLUTE NEVER (KYC document data; PII)
  updatedAt: string;
}

// ── Languages Management ──────────────────────────────────────────────────

export interface AdminLanguage {
  id: string;
  languageCode: string; // 'ht-HT' | 'en-US' | 'es-DO' | 'fr-FR'
  languageName: string;
  countrySupport: string[]; // array of ISO country codes
  translationStatus: string; // 'active' | 'beta' | 'deprecated'
  aiTranslationEnabled: boolean;
  // localization_payload excluded — JSONB with no type contract
  updatedAt: string;
}

// ── Billing Control (super admin view) ────────────────────────────────────

export interface AdminBillingTransaction {
  id: string;
  tenantId: string | null;
  userId: string | null;
  transactionType: string; // 'subscription' | 'invoice' | 'refund' | 'payout'
  amount: number; // NUMERIC(14,4) — decimal from DB
  currencyCode: string;
  billingStatus: string; // 'pending' | 'completed' | 'failed' | 'refunded'
  gatewayReferenceId: string | null;
  // metadata excluded — JSONB with no type contract
  createdAt: string;
}

// ── System Monitoring Events ──────────────────────────────────────────────

export interface SystemMonitoringEvent {
  id: string;
  eventSeverity: string; // 'info' | 'warning' | 'error' | 'critical'
  serviceName: string;
  // error_message excluded — may contain stack traces and internal error details
  latencyMs: number;
  // endpoint_path excluded — reveals internal API routing structure
  // payload excluded — JSONB; arbitrary monitoring data; may contain sensitive details
  occurredAt: string;
}

// ── Deployment Releases ───────────────────────────────────────────────────

export interface DeploymentRelease {
  id: string;
  versionTag: string; // 'v1.0.1'
  targetEnvironment: string; // 'production' | 'staging' | 'development'
  deploymentStatus: string; // 'deployed' | 'rollback' | 'failed'
  // git_commit_hash excluded — reveals internal commit history; aids targeted exploitation of known-vulnerable versions
  deployedByAdminId: string | null;
  releaseNotes: string | null;
  deployedAt: string;
}

// ── Feature Flags (global rollout control) ────────────────────────────────

export interface FeatureFlag {
  id: string;
  flagName: string; // 'new_wallet' | 'ai_matching_beta'
  isGloballyEnabled: boolean;
  rolloutPercentage: number; // 0–100
  // target_rules_json excluded — JSONB A/B testing cohort config; reveals user segmentation logic
  description: string | null;
  updatedAt: string;
}

// ── AI Training Management ────────────────────────────────────────────────

export interface AiTrainingJob {
  id: string;
  modelJobName: string;
  baseModelIdentifier: string;
  // training_dataset_uri excluded — reveals internal storage paths and dataset locations
  // hyperparameters_json excluded — JSONB; reveals training configuration and architecture strategy
  trainingStatus: string; // 'queued' | 'training_in_progress' | 'completed' | 'failed'
  validationAccuracy: number; // 0.00–100.00 percentage
  trainedAt: string | null;
  createdAt: string;
}

// ── Migration 030: Granular RBAC, Currency Rates & Geo Compliance ─────────
//
// Backend-only tables (no frontend types):
//   enterprise_active_sessions_telemetry — client_ip = NEVER (PII); device_fingerprint_hash
//     = excluded (cross-session tracking); refresh_token_id = ABSOLUTE NEVER (session credential);
//     risk_multiplier = excluded (AI behavioral scoring signal; enables gaming);
//     is_flagged_suspicious = excluded (anomaly boolean; enables gaming anomaly detection);
//     last_location = PII (location data); always BACKEND ONLY (session telemetry table)
//   enterprise_global_operations_view    — REVOKE ALL from authenticated; service_role only: BACKEND ONLY
//   evaluate_sovereign_abac_access       — PL/pgSQL SECURITY DEFINER function: backend only
//   execute_global_escrow_transfer       — PL/pgSQL, GRANT TO service_role only: backend only
//
// ALTER TABLE: profiles.compliance_kyc_status added to Profile interface in profile.ts

// ── Enterprise RBAC Permissions Catalog ──────────────────────────────────

export interface EnterprisePermission {
  permissionCode: string; // 'users.read' | 'wallet.transfer' | 'system.config' etc.
  domainScope: string; // 'users' | 'jobs' | 'wallet' | 'billing' | 'analytics' | 'ai' | 'system'
  description: string | null;
  createdAt: string;
}

// ── Official Currency Exchange Rates ──────────────────────────────────────

export interface EnterpriseCurrencyRate {
  currencyCode: string; // 'USD' | 'EUR' | 'GBP' | 'HTG'
  rateToUsd: number; // NUMERIC(24,10) — official immutable rate used by escrow engine
  updatedAt: string;
}

// ── Geo Compliance Registry ────────────────────────────────────────────────

export interface GeoComplianceEntry {
  id: string;
  countryIsoCode: string; // ISO alpha-3 e.g. 'USA' | 'HTI' | 'FRA'
  isSanctioned: boolean;
  requiresStrictKyc: boolean;
  allowedPaymentGateways: string[]; // parsed from JSONB — gateway name list for UI routing hints
  updatedAt: string;
}
