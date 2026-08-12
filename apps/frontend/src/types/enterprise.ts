// ── Approval Workflows ────────────────────────────────────────────────────

export const APPROVAL_TARGET_ENTITIES = [
  'leave_request', 'payroll_run', 'invoice', 'expense', 'purchase_order',
  'job_posting', 'identity_verification', 'employer_verification',
  'ai_review', 'legal_review', 'contract_signing',
] as const;
export type ApprovalTargetEntity = typeof APPROVAL_TARGET_ENTITIES[number];

export const APPROVAL_INSTANCE_STATUSES = [
  'pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'escalated',
] as const;
export type ApprovalInstanceStatus = typeof APPROVAL_INSTANCE_STATUSES[number];

export const APPROVAL_ACTIONS = [
  'approved', 'rejected', 'escalated', 'ai_auto_approved', 'bypassed',
] as const;
export type ApprovalAction = typeof APPROVAL_ACTIONS[number];

export interface ApprovalWorkflow {
  id: string;
  organizationId: string;
  workflowCode: string;
  workflowName: string;
  targetEntity: ApprovalTargetEntity;
  isActive: boolean;
  createdAt: string;
  // trigger_conditions excluded — internal workflow condition logic, backend evaluates
}

export interface ApprovalStep {
  id: string;
  workflowId: string;
  stepOrder: number;
  stepName: string;
  requiredRoleId: string | null;
  approverEmployeeId: string | null;
  allowAiAutoApproval: boolean;
  timeoutHours: number;
  isMandatory: boolean;
  createdAt: string;
  // ai_confidence_threshold excluded — internal AI tuning parameter, backend only
}

export interface ApprovalWorkflowInstance {
  id: string;
  workflowId: string;
  organizationId: string;
  entityId: string;
  currentStepOrder: number;
  instanceStatus: ApprovalInstanceStatus;
  submittedBy: string | null;
  finalFeedback: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface ApprovalStepLog {
  id: string;
  instanceId: string;
  stepId: string;
  actorEmployeeId: string | null;
  actionTaken: ApprovalAction;
  comments: string | null;
  actedAt: string;
  // ai_evaluation_data excluded — internal AI evaluation data, backend only
}

// ── Payrolls ──────────────────────────────────────────────────────────────

export const PAY_FREQUENCIES = [
  'hourly', 'daily', 'weekly', 'biweekly', 'monthly', 'commission', 'contract', 'gig_economy',
] as const;
export type PayFrequency = typeof PAY_FREQUENCIES[number];

export const PAYOUT_METHODS = [
  'direct_deposit', 'wallet_payment', 'crypto', 'wire_transfer', 'cash', 'check', 'stablecoin',
] as const;
export type PayoutMethod = typeof PAYOUT_METHODS[number];

export const PAYOUT_STATUSES = [
  'draft', 'pending_approval', 'approved', 'processing', 'completed', 'failed', 'cancelled', 'audited',
] as const;
export type PayoutStatus = typeof PAYOUT_STATUSES[number];

export const PAYROLL_ITEM_TYPES = [
  'base_pay', 'overtime', 'bonus', 'commission', 'allowance_housing', 'allowance_transport',
  'tax_income', 'tax_social_security', 'insurance_health', 'pension', 'loan_repayment', 'adjustment',
] as const;
export type PayrollItemType = typeof PAYROLL_ITEM_TYPES[number];

export const PAYROLL_TX_STATUSES = ['success', 'pending', 'failed', 'refunded', 'disputed'] as const;
export type PayrollTxStatus = typeof PAYROLL_TX_STATUSES[number];

export interface Payroll {
  id: string;
  organizationId: string;
  employeeId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payFrequency: PayFrequency;
  grossSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
  currency: string;
  exchangeRateToUsd: number;
  payoutMethod: PayoutMethod;
  payoutStatus: PayoutStatus;
  processedAt: string | null;
  createdAt: string;
  // disbursement_batch_id excluded — internal batch processing reference, backend only
}

export interface PayrollLineItem {
  id: string;
  payrollId: string;
  itemType: PayrollItemType;
  itemName: string;
  amount: number;
  currency: string;
  isTaxable: boolean;
  createdAt: string;
  // metadata excluded — internal processing data, backend only
}

export interface PayrollTransaction {
  id: string;
  payrollId: string;
  organizationId: string;
  transactionReference: string;
  amountPaid: number;
  currency: string;
  walletId: string | null;
  cryptoTxHash: string | null;
  blockchainNetwork: string | null;
  status: PayrollTxStatus;
  transactedAt: string;
  // gateway_response excluded — internal gateway response, may contain auth tokens
}

// ── Enterprise Reports ────────────────────────────────────────────────────

export const REPORT_CATEGORIES = [
  'financial', 'payroll', 'attendance', 'performance', 'compliance',
  'audit', 'executive_summary', 'ai_insights', 'tax_filing',
] as const;
export type ReportCategory = typeof REPORT_CATEGORIES[number];

export const REPORT_FREQUENCY_TYPES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const;
export type ReportFrequencyType = typeof REPORT_FREQUENCY_TYPES[number];

export interface EnterpriseReport {
  id: string;
  organizationId: string;
  reportTitle: string;
  reportCategory: ReportCategory;
  exportFormats: string[];
  fileUrl: string | null;
  fileSizeBytes: number;
  aiSummaryText: string | null;
  isScheduled: boolean;
  recipientEmails: string[];
  generatedBy: string | null;
  createdAt: string;
  // parameters_config excluded — internal query configuration, backend builds queries
  // cron_schedule excluded — backend scheduling concern
}

export interface EnterpriseReportSchedule {
  id: string;
  reportId: string | null;
  organizationId: string;
  scheduleName: string;
  frequencyType: ReportFrequencyType;
  cronExpression: string;
  deliveryChannels: string[];
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
}

// ── Audit Logs ────────────────────────────────────────────────────────────

export const AUDIT_SEVERITY_LEVELS = [
  'info', 'warning', 'critical', 'emergency', 'quantum_alert',
] as const;
export type AuditSeverityLevel = typeof AUDIT_SEVERITY_LEVELS[number];

export interface AuditLog {
  id: string;
  organizationId: string;
  actorEmployeeId: string | null;
  actorUserId: string | null;
  actionType: string;
  targetResource: string;
  resourceId: string | null;
  severityLevel: AuditSeverityLevel;
  performedAt: string;
  // ip_address excluded — PII (personal data under GDPR)
  // geo_location excluded — precise location PII (POINT type)
  // cryptographic_hash excluded — immutability verification, backend verifies
  // user_agent excluded — device fingerprinting PII
  // previous_state, new_state excluded — may contain any sensitive data
}

// ── Enterprise Integrations ───────────────────────────────────────────────

export const INTEGRATION_NAMES = [
  'microsoft_365', 'google_workspace', 'slack', 'zoom', 'sap', 'stripe',
  'quickbooks', 'workday', 'oracle_hcm', 'salesforce', 'hubspot', 'custom_webhook',
] as const;
export type IntegrationName = typeof INTEGRATION_NAMES[number];

export const WEBHOOK_DISPATCH_STATUSES = [
  'pending', 'success', 'failed', 'retrying', 'exhausted',
] as const;
export type WebhookDispatchStatus = typeof WEBHOOK_DISPATCH_STATUSES[number];

export interface EnterpriseIntegration {
  id: string;
  organizationId: string;
  integrationName: IntegrationName;
  webhookUrl: string | null;
  isConnected: boolean;
  syncFrequencyMinutes: number;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // api_credentials_encrypted — NEVER (encrypted credentials)
  // signing_secret — NEVER (webhook signing secret)
  // settings_config excluded — internal configuration details
}

export interface EnterpriseWebhookDispatch {
  id: string;
  integrationId: string;
  eventType: string;
  responseStatusCode: number | null;
  retryCount: number;
  dispatchStatus: WebhookDispatchStatus;
  dispatchedAt: string;
  // payload_data excluded — may contain PII or sensitive business data
  // response_body excluded — internal gateway response data
}

// ── Enterprise Admin Platform V5.0 (Migration 024) ────────────────────────
//
// Backend-only tables (no frontend types):
//   admin_sessions        — token_hash = ABSOLUTE NEVER (session credential hash);
//                           ip_address = NEVER (PII)
//   admin_audit_logs      — ip_address = NEVER (PII); before_state/after_state may
//                           snapshot arbitrary sensitive data across any table
//   system_configurations — config_value TEXT may contain internal credentials,
//                           API keys, or system secrets; never expose via client

export const FRAUD_CASE_STATUSES = ['open', 'investigating', 'resolved', 'false_positive', 'banned'] as const;
export type FraudCaseStatus = typeof FRAUD_CASE_STATUSES[number];

export const INCIDENT_SEVERITIES = ['low', 'normal', 'high', 'critical', 'emergency'] as const;
export type IncidentSeverity = typeof INCIDENT_SEVERITIES[number];

export const INCIDENT_STATUSES = ['investigating', 'identified', 'monitoring', 'resolved'] as const;
export type IncidentStatus = typeof INCIDENT_STATUSES[number];

export const ANNOUNCEMENT_AUDIENCES = ['all', 'users', 'businesses', 'workers'] as const;
export type AnnouncementAudience = typeof ANNOUNCEMENT_AUDIENCES[number];

export interface AdminRole {
  id: string;
  roleName: string;
  description: string | null;
  createdAt: string;
}

export interface AdminPermission {
  id: string;
  permissionCode: string;
  description: string | null;
  createdAt: string;
}

export interface AdminRolePermission {
  roleId: string;
  permissionId: string;
}

export interface AdminUser {
  id: string;
  profileId: string | null;
  roleId: string | null;
  isSuperAdmin: boolean;
  mfaEnabled: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AdminFeatureFlag {
  id: string;
  flagKey: string;
  description: string | null;
  isEnabled: boolean;
  rolloutPercentage: number;
  updatedAt: string;
  createdAt: string;
}

export interface AdminFraudCase {
  id: string;
  profileId: string | null;
  businessId: string | null;
  riskScore: number;
  detectionReason: string;
  status: FraudCaseStatus;
  assignedAdminId: string | null;
  createdAt: string;
}

export interface AdminIncident {
  id: string;
  incidentTitle: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignedTeam: string;
  resolutionNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AdminApiKey {
  id: string;
  businessId: string | null;
  keyName: string;
  // api_key_hash excluded — ABSOLUTE NEVER (credential hash; even hash exposure
  // enables offline comparison attacks against stolen hashes)
  permissions: unknown[];
  requestsToday: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  message: string;
  targetAudience: AnnouncementAudience;
  countryFilter: string | null;
  isActive: boolean;
  createdAt: string;
}
