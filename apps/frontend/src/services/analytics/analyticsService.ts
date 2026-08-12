import { supabase } from '../../lib/supabase';
import type {
  ExecutiveKpiSnapshot,
  UserCohortMetrics,
  AnalyticsReportExport,
  AnalyticsDashboardPermission,
  AnalyticsRetentionPolicy,
} from '../../types/analytics';

// Phase 15 Omniverse Intelligence & Autonomous Analytics Matrix
//
// Backend-only tables (zero functions here):
//   omnichannel_analytics_ledger — ip_address = NEVER; ai_prediction_score/ai_confidence_score
//     = NEVER; ai_anomaly_detected/ai_prediction_type/ai_model_version excluded (reveals
//     detection categories; aids evasion); raw per-event telemetry
//   analytics_events       — ip_address = NEVER (PII); raw per-click event stream
//   conversion_funnels     — raw per-user funnel events; internal instrumentation
//   fraud_analytics_ledger — ip_address = NEVER; risk_score = NEVER; fraud_type/risk_category
//     excluded (reveals detection categories); fraud analytics always BACKEND ONLY
//   analytics_stream_events — internal Kafka/Redis stream table; payload = arbitrary JSONB

// ── Column constants ───────────────────────────────────────────────────────

const KPI_SNAPSHOT_COLS = [
  'id', 'snapshot_period_type', 'period_identifier', 'metric_name',
  'current_value', 'previous_period_value', 'growth_percentage', 'trend_direction',
  'total_active_users', 'total_business_revenue', 'marketplace_gross_volume',
  'active_jobs_count', 'platform_health_score', 'ai_executive_narrative', 'generated_at',
].join(', ');
// fraud_risk_index excluded — aggregate fraud detection state; exposing aids adversarial timing attacks
// executive_summary_payload excluded — JSONB with no type contract
// ai_actionable_recommendations excluded — JSONB array with no type contract
// metadata excluded — JSONB with no type contract

const COHORT_METRICS_COLS = 'id, cohort_month, total_registered_users, active_after_7_days, active_after_30_days, active_after_90_days, retention_rate_7d, retention_rate_30d, retention_rate_90d, updated_at';
// metadata excluded — JSONB with no type contract

const REPORT_EXPORT_COLS = [
  'id', 'requester_user_id', 'organization_id', 'report_title', 'report_domain',
  'export_format', 'export_status', 'compression_type', 'generated_by_ai', 'access_count',
  'file_storage_url', 'file_size_bytes', 'download_expires_at', 'created_at', 'completed_at',
].join(', ');
// encryption_key_id excluded — internal encryption key reference; revealing key IDs aids targeted attacks
// applied_filters_payload excluded — JSONB with no type contract; may contain sensitive query parameters
// metadata excluded — JSONB with no type contract

const DASHBOARD_PERMISSION_COLS = 'id, role_name, allowed_domains, access_level, can_export_data, created_at';
// metadata excluded — JSONB with no type contract

const RETENTION_POLICY_COLS = 'id, table_name, hot_storage_days, cold_storage_years, archival_action, is_active, updated_at';

// ── Row types ─────────────────────────────────────────────────────────────

type KpiSnapshotRow = { id: string; snapshot_period_type: string; period_identifier: string; metric_name: string; current_value: number; previous_period_value: number; growth_percentage: number; trend_direction: string; total_active_users: number; total_business_revenue: number; marketplace_gross_volume: number; active_jobs_count: number; platform_health_score: number; ai_executive_narrative: string | null; generated_at: string; };
type CohortMetricsRow = { id: string; cohort_month: string; total_registered_users: number; active_after_7_days: number; active_after_30_days: number; active_after_90_days: number; retention_rate_7d: number; retention_rate_30d: number; retention_rate_90d: number; updated_at: string; };
type ReportExportRow = { id: string; requester_user_id: string | null; organization_id: string | null; report_title: string; report_domain: string; export_format: string; export_status: string; compression_type: string; generated_by_ai: boolean; access_count: number; file_storage_url: string | null; file_size_bytes: number; download_expires_at: string | null; created_at: string; completed_at: string | null; };
type DashboardPermissionRow = { id: string; role_name: string; allowed_domains: string[]; access_level: string; can_export_data: boolean; created_at: string; };
type RetentionPolicyRow = { id: string; table_name: string; hot_storage_days: number; cold_storage_years: number; archival_action: string; is_active: boolean; updated_at: string; };

// ── Mappers ───────────────────────────────────────────────────────────────

const mapKpiSnapshot = (r: KpiSnapshotRow): ExecutiveKpiSnapshot => ({ id: r.id, snapshotPeriodType: r.snapshot_period_type, periodIdentifier: r.period_identifier, metricName: r.metric_name, currentValue: r.current_value, previousPeriodValue: r.previous_period_value, growthPercentage: r.growth_percentage, trendDirection: r.trend_direction, totalActiveUsers: r.total_active_users, totalBusinessRevenue: r.total_business_revenue, marketplaceGrossVolume: r.marketplace_gross_volume, activeJobsCount: r.active_jobs_count, platformHealthScore: r.platform_health_score, aiExecutiveNarrative: r.ai_executive_narrative, generatedAt: r.generated_at });
const mapCohortMetrics = (r: CohortMetricsRow): UserCohortMetrics => ({ id: r.id, cohortMonth: r.cohort_month, totalRegisteredUsers: r.total_registered_users, activeAfter7Days: r.active_after_7_days, activeAfter30Days: r.active_after_30_days, activeAfter90Days: r.active_after_90_days, retentionRate7d: r.retention_rate_7d, retentionRate30d: r.retention_rate_30d, retentionRate90d: r.retention_rate_90d, updatedAt: r.updated_at });
const mapReportExport = (r: ReportExportRow): AnalyticsReportExport => ({ id: r.id, requesterUserId: r.requester_user_id, organizationId: r.organization_id, reportTitle: r.report_title, reportDomain: r.report_domain, exportFormat: r.export_format, exportStatus: r.export_status, compressionType: r.compression_type, generatedByAi: r.generated_by_ai, accessCount: r.access_count, fileStorageUrl: r.file_storage_url, fileSizeBytes: r.file_size_bytes, downloadExpiresAt: r.download_expires_at, createdAt: r.created_at, completedAt: r.completed_at });
const mapDashboardPermission = (r: DashboardPermissionRow): AnalyticsDashboardPermission => ({ id: r.id, roleName: r.role_name, allowedDomains: r.allowed_domains, accessLevel: r.access_level, canExportData: r.can_export_data, createdAt: r.created_at });
const mapRetentionPolicy = (r: RetentionPolicyRow): AnalyticsRetentionPolicy => ({ id: r.id, tableName: r.table_name, hotStorageDays: r.hot_storage_days, coldStorageYears: r.cold_storage_years, archivalAction: r.archival_action, isActive: r.is_active, updatedAt: r.updated_at });

// ── Executive KPI Snapshots ───────────────────────────────────────────────

export async function getKpiSnapshots(options: { periodType?: string; metricName?: string; limit?: number } = {}): Promise<ExecutiveKpiSnapshot[]> {
  let q = supabase.from('executive_kpi_snapshots').select(KPI_SNAPSHOT_COLS);
  if (options.periodType) q = q.eq('snapshot_period_type', options.periodType);
  if (options.metricName) q = q.eq('metric_name', options.metricName);
  const { data, error } = await q.order('generated_at', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as unknown as KpiSnapshotRow[]).map(mapKpiSnapshot);
}

export async function getLatestKpiSnapshot(metricName: string, periodType?: string): Promise<ExecutiveKpiSnapshot | null> {
  let q = supabase.from('executive_kpi_snapshots').select(KPI_SNAPSHOT_COLS).eq('metric_name', metricName);
  if (periodType) q = q.eq('snapshot_period_type', periodType);
  const { data, error } = await q.order('generated_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? mapKpiSnapshot(data as unknown as KpiSnapshotRow) : null;
}

// ── User Cohort Metrics ───────────────────────────────────────────────────

export async function getCohortMetrics(options: { from?: string; to?: string; limit?: number } = {}): Promise<UserCohortMetrics[]> {
  let q = supabase.from('user_cohort_metrics').select(COHORT_METRICS_COLS);
  if (options.from) q = q.gte('cohort_month', options.from);
  if (options.to) q = q.lte('cohort_month', options.to);
  const { data, error } = await q.order('cohort_month', { ascending: false }).limit(options.limit ?? 24);
  if (error) throw error;
  return (data as unknown as CohortMetricsRow[]).map(mapCohortMetrics);
}

export async function getCohortByMonth(cohortMonth: string): Promise<UserCohortMetrics | null> {
  const { data, error } = await supabase.from('user_cohort_metrics').select(COHORT_METRICS_COLS).eq('cohort_month', cohortMonth).maybeSingle();
  if (error) throw error;
  return data ? mapCohortMetrics(data as unknown as CohortMetricsRow) : null;
}

// ── Analytics Report Export Queue ─────────────────────────────────────────

export async function getMyReportExports(options: { status?: string; limit?: number } = {}): Promise<AnalyticsReportExport[]> {
  // RLS filters to the current user's requester_user_id
  let q = supabase.from('analytics_reports_export_queue').select(REPORT_EXPORT_COLS);
  if (options.status) q = q.eq('export_status', options.status);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as unknown as ReportExportRow[]).map(mapReportExport);
}

export async function getOrgReportExports(organizationId: string, options: { status?: string; limit?: number } = {}): Promise<AnalyticsReportExport[]> {
  let q = supabase.from('analytics_reports_export_queue').select(REPORT_EXPORT_COLS).eq('organization_id', organizationId);
  if (options.status) q = q.eq('export_status', options.status);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as unknown as ReportExportRow[]).map(mapReportExport);
}

export async function getReportExport(id: string): Promise<AnalyticsReportExport | null> {
  const { data, error } = await supabase.from('analytics_reports_export_queue').select(REPORT_EXPORT_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapReportExport(data as unknown as ReportExportRow) : null;
}

// ── Analytics Dashboard Permissions ──────────────────────────────────────

export async function getDashboardPermissions(): Promise<AnalyticsDashboardPermission[]> {
  const { data, error } = await supabase.from('analytics_dashboard_permissions').select(DASHBOARD_PERMISSION_COLS).order('role_name');
  if (error) throw error;
  return (data as unknown as DashboardPermissionRow[]).map(mapDashboardPermission);
}

export async function getDashboardPermission(roleName: string): Promise<AnalyticsDashboardPermission | null> {
  // UNIQUE (role_name) — one row per role
  const { data, error } = await supabase.from('analytics_dashboard_permissions').select(DASHBOARD_PERMISSION_COLS).eq('role_name', roleName).maybeSingle();
  if (error) throw error;
  return data ? mapDashboardPermission(data as unknown as DashboardPermissionRow) : null;
}

// ── Analytics Retention Policies ──────────────────────────────────────────

export async function getRetentionPolicies(activeOnly = true): Promise<AnalyticsRetentionPolicy[]> {
  let q = supabase.from('analytics_retention_policy').select(RETENTION_POLICY_COLS);
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q.order('table_name');
  if (error) throw error;
  return (data as unknown as RetentionPolicyRow[]).map(mapRetentionPolicy);
}

export async function getRetentionPolicy(tableName: string): Promise<AnalyticsRetentionPolicy | null> {
  // UNIQUE (table_name) — one policy per table
  const { data, error } = await supabase.from('analytics_retention_policy').select(RETENTION_POLICY_COLS).eq('table_name', tableName).maybeSingle();
  if (error) throw error;
  return data ? mapRetentionPolicy(data as unknown as RetentionPolicyRow) : null;
}
