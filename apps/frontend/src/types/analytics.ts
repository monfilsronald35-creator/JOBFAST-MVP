// ── Analytics Sessions ─────────────────────────────────────────────────────

export const ANALYTICS_DEVICE_TYPES = [
  'mobile', 'tablet', 'desktop', 'iot', 'edge_api', 'quantum', 'neural_link',
] as const;
export type AnalyticsDeviceType = typeof ANALYTICS_DEVICE_TYPES[number];

export interface AnalyticsSession {
  id: string;
  tenantId: string;
  userId: string | null;
  countryCode: string;
  cityName: string | null;
  deviceType: AnalyticsDeviceType | null;
  osName: string | null;
  browserName: string | null;
  networkSpeedMbps: number;
  latencyMs: number;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  // ip_address excluded — PII
}

// ── Analytics Events ───────────────────────────────────────────────────────

export const ANALYTICS_EVENT_CATEGORIES = [
  'auth', 'job', 'marketplace', 'wallet', 'ai', 'search',
  'notification', 'payment', 'system', 'navigation',
  'security_breach', 'edge_sync', 'quantum_stream',
] as const;
export type AnalyticsEventCategory = typeof ANALYTICS_EVENT_CATEGORIES[number];

export const ANALYTICS_PROPERTY_TYPES = ['string', 'number', 'boolean', 'json', 'vector'] as const;
export type AnalyticsPropertyType = typeof ANALYTICS_PROPERTY_TYPES[number];

export interface AnalyticsEvent {
  id: string;
  sessionId: string | null;
  tenantId: string;
  userId: string | null;
  eventName: string;
  eventCategory: AnalyticsEventCategory;
  countryCode: string;
  createdAt: string;
  // event_vector (vector 1538) excluded — ML neural embedding
  // geolocation (POINT) excluded — precise location PII
}

export interface AnalyticsEventProperty {
  id: string;
  eventId: string;
  eventCreatedAt: string;
  propertyKey: string;
  propertyValue: string;
  propertyType: AnalyticsPropertyType;
}

// ── User Metrics ───────────────────────────────────────────────────────────

export interface UserMetrics {
  id: string;
  userId: string;
  tenantId: string;
  totalSessions: number;
  totalEvents: number;
  lifetimeValue: number;
  engagementVelocityScore: number;
  neuralTrustScore: number;
  lastActiveAt: string | null;
  updatedAt: string;
}

export interface UserDailyMetrics {
  id: string;
  userId: string;
  tenantId: string;
  metricDate: string;
  sessionsCount: number;
  actionsCount: number;
  activeDurationSeconds: number;
  aiTokensConsumed: number;
}

export interface UserEngagementMetrics {
  id: string;
  userId: string;
  tenantId: string;
  moduleName: string;
  interactionCount: number;
  engagementScore: number;
  updatedAt: string;
}

// ── Revenue Transactions ───────────────────────────────────────────────────

export interface RevenueTransaction {
  id: string;
  transactionId: string;
  tenantId: string;
  userId: string | null;
  amount: number;
  feeAmount: number;
  serviceType: string;
  countryCode: string;
  status: string;
  transactedAt: string;
}

// ── Conversion Tracking ────────────────────────────────────────────────────

export interface ConversionTracking {
  id: string;
  tenantId: string;
  userId: string | null;
  funnelName: string;
  stepName: string;
  isConverted: boolean;
  conversionValue: number;
  trackedAt: string;
}

export interface ConversionFunnel {
  id: string;
  tenantId: string;
  funnelCode: string;
  funnelName: string;
  description: string | null;
  isActive: boolean;
}

export interface ConversionStep {
  id: string;
  funnelId: string;
  stepOrder: number;
  stepName: string;
  eventTrigger: string;
}

// ── Dashboards & Widgets ───────────────────────────────────────────────────

export const ANALYTICS_DASHBOARD_TYPES = [
  'admin', 'executive', 'revenue', 'ai', 'country', 'city',
  'live', 'financial', 'marketplace', 'jobs', 'wallet', 'quantum_telemetry',
] as const;
export type AnalyticsDashboardType = typeof ANALYTICS_DASHBOARD_TYPES[number];

export const ANALYTICS_WIDGET_TYPES = [
  'chart', 'metric_card', 'table', 'map', 'funnel',
  'live_feed', 'vector_cluster', 'neural_stream',
] as const;
export type AnalyticsWidgetType = typeof ANALYTICS_WIDGET_TYPES[number];

export interface AnalyticsDashboard {
  id: string;
  tenantId: string;
  dashboardKey: string;
  dashboardTitle: string;
  dashboardType: AnalyticsDashboardType;
  createdBy: string | null;
  createdAt: string;
}

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  widgetTitle: string;
  widgetType: AnalyticsWidgetType;
  positionIndex: number;
  // query_config excluded — internal query definition (never expose to frontend)
}

// ── Exports ────────────────────────────────────────────────────────────────

export const ANALYTICS_EXPORT_TYPES = [
  'csv', 'excel', 'pdf', 'json', 'parquet', 'arrow',
] as const;
export type AnalyticsExportType = typeof ANALYTICS_EXPORT_TYPES[number];

export interface AnalyticsExport {
  id: string;
  tenantId: string;
  exportType: AnalyticsExportType;
  fileUrl: string;
  requestedBy: string;
  status: string;
  createdAt: string;
}

// ── Phase 15 Omniverse Intelligence & Autonomous Analytics Matrix ──────────
//
// Backend-only tables (no frontend types):
//   omnichannel_analytics_ledger — ip_address = NEVER (PII);
//     ai_prediction_score/ai_confidence_score = NEVER (AI behavioral scoring);
//     ai_anomaly_detected/ai_prediction_type/ai_model_version excluded
//     (reveals detection categories and model targeting surface; aids evasion);
//     raw per-event telemetry — not for direct client access
//   analytics_events    — ip_address = NEVER (PII); raw per-click event stream;
//                         internal frontend instrumentation
//   conversion_funnels  — raw per-user funnel event stream; internal instrumentation;
//                         no safe surface beyond what aggregate tables expose
//   fraud_analytics_ledger — ip_address = NEVER (PII); risk_score = NEVER (AI scoring);
//     fraud_type/risk_category excluded (reveals detection categories; enables evasion);
//     fraud analytics always BACKEND ONLY
//   analytics_stream_events — internal Kafka/Redis message queue stored in Postgres;
//     payload = arbitrary JSONB with no type contract; pure infrastructure

// ── Executive KPI Snapshots ───────────────────────────────────────────────

export interface ExecutiveKpiSnapshot {
  id: string;
  snapshotPeriodType: string; // 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  periodIdentifier: string;   // e.g. '2026-08', '2026-W32', '2026-Q3'
  metricName: string;
  currentValue: number;
  previousPeriodValue: number;
  growthPercentage: number;
  trendDirection: string; // 'up' | 'down' | 'stable'
  totalActiveUsers: number;
  totalBusinessRevenue: number;
  marketplaceGrossVolume: number;
  activeJobsCount: number;
  platformHealthScore: number;
  // fraud_risk_index excluded — aggregate fraud detection state; exposing aids adversarial timing attacks
  // executive_summary_payload excluded — JSONB with no type contract
  aiExecutiveNarrative: string | null; // AI-generated natural language summary — safe to expose
  // ai_actionable_recommendations excluded — JSONB array with no type contract
  // metadata excluded — JSONB with no type contract
  generatedAt: string;
}

// ── User Cohort Metrics ───────────────────────────────────────────────────

export interface UserCohortMetrics {
  id: string;
  cohortMonth: string; // 'YYYY-MM'
  totalRegisteredUsers: number;
  activeAfter7Days: number;
  activeAfter30Days: number;
  activeAfter90Days: number;
  retentionRate7d: number;
  retentionRate30d: number;
  retentionRate90d: number;
  // metadata excluded — JSONB with no type contract
  updatedAt: string;
}

// ── Analytics Report Export Queue ─────────────────────────────────────────

export interface AnalyticsReportExport {
  id: string;
  requesterUserId: string | null;
  organizationId: string | null;
  reportTitle: string;
  reportDomain: string;
  exportFormat: string; // 'csv' | 'excel' | 'pdf' | 'json' | 'parquet'
  exportStatus: string; // 'queued' | 'processing' | 'completed' | 'failed' | 'secure_download_ready'
  compressionType: string;
  // encryption_key_id excluded — internal encryption key reference; revealing key IDs aids targeted attacks
  generatedByAi: boolean;
  accessCount: number;
  // applied_filters_payload excluded — JSONB with no type contract; may contain sensitive query parameters
  fileStorageUrl: string | null;
  fileSizeBytes: number;
  downloadExpiresAt: string | null;
  // metadata excluded — JSONB with no type contract
  createdAt: string;
  completedAt: string | null;
}

// ── Analytics Dashboard Permissions ──────────────────────────────────────

export interface AnalyticsDashboardPermission {
  id: string;
  roleName: string;
  allowedDomains: string[];
  accessLevel: string; // 'read_only' | 'full_access' | 'export_only'
  canExportData: boolean;
  // metadata excluded — JSONB with no type contract
  createdAt: string;
}

// ── Analytics Retention Policy ────────────────────────────────────────────

export interface AnalyticsRetentionPolicy {
  id: string;
  tableName: string;
  hotStorageDays: number;
  coldStorageYears: number;
  archivalAction: string; // 'move_to_cold' | 'delete' | 'anonymize'
  isActive: boolean;
  updatedAt: string;
}
