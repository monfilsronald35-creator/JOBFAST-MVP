import { supabase } from '../../lib/supabase';
import type {
  ApprovalWorkflow,
  ApprovalTargetEntity,
  ApprovalStep,
  ApprovalWorkflowInstance,
  ApprovalInstanceStatus,
  ApprovalStepLog,
  ApprovalAction,
  Payroll,
  PayoutStatus,
  PayrollLineItem,
  PayrollTransaction,
  EnterpriseReport,
  ReportCategory,
  EnterpriseReportSchedule,
  AuditLog,
  AuditSeverityLevel,
  EnterpriseIntegration,
  EnterpriseWebhookDispatch,
  WebhookDispatchStatus,
} from '../../types/enterprise';

// Backend-only fields (never queried from frontend):
//   approval_workflows:         trigger_conditions — backend evaluates workflow conditions
//   approval_steps:             ai_confidence_threshold — internal AI tuning, backend only
//   approval_step_logs:         ai_evaluation_data — internal AI evaluation data
//   payrolls:                   disbursement_batch_id — internal batch reference
//   payroll_line_items:         metadata — internal processing data
//   payroll_transactions:       gateway_response — may contain auth tokens
//   enterprise_reports:         parameters_config — internal query config
//                               cron_schedule — backend scheduling concern
//   audit_logs:                 ip_address, geo_location — PII
//                               cryptographic_hash — immutability verification
//                               user_agent — device fingerprinting PII
//                               previous_state, new_state — may contain any sensitive data
//   enterprise_integrations:    api_credentials_encrypted, signing_secret — NEVER
//                               settings_config — internal configuration
//   enterprise_webhook_dispatches: payload_data — may contain PII
//                                  response_body — internal gateway data
//
// Payroll WRITE operations (create, approve, process, disburse) are backend-only.
// Integration WRITE operations (connect, disconnect, rotate credentials) are backend-only.
// Audit logs are ALWAYS read-only from the frontend.

// ── Column constants ───────────────────────────────────────────────────────

const WORKFLOW_COLS =
  'id, organization_id, workflow_code, workflow_name, target_entity, is_active, created_at';

const STEP_COLS =
  'id, workflow_id, step_order, step_name, required_role_id, approver_employee_id, allow_ai_auto_approval, timeout_hours, is_mandatory, created_at';

const INSTANCE_COLS =
  'id, workflow_id, organization_id, entity_id, current_step_order, instance_status, submitted_by, final_feedback, completed_at, created_at';

const STEP_LOG_COLS =
  'id, instance_id, step_id, actor_employee_id, action_taken, comments, acted_at';

const PAYROLL_COLS =
  'id, organization_id, employee_id, pay_period_start, pay_period_end, pay_frequency, gross_salary, total_allowances, total_deductions, net_salary, currency, exchange_rate_to_usd, payout_method, payout_status, processed_at, created_at';

const LINE_ITEM_COLS =
  'id, payroll_id, item_type, item_name, amount, currency, is_taxable, created_at';

const PAYROLL_TX_COLS =
  'id, payroll_id, organization_id, transaction_reference, amount_paid, currency, wallet_id, crypto_tx_hash, blockchain_network, status, transacted_at';

const REPORT_COLS =
  'id, organization_id, report_title, report_category, export_formats, file_url, file_size_bytes, ai_summary_text, is_scheduled, recipient_emails, generated_by, created_at';

const AUDIT_LOG_COLS =
  'id, organization_id, actor_employee_id, actor_user_id, action_type, target_resource, resource_id, severity_level, performed_at';

const INTEGRATION_COLS =
  'id, organization_id, integration_name, webhook_url, is_connected, sync_frequency_minutes, last_synced_at, created_at, updated_at';

const WEBHOOK_DISPATCH_COLS =
  'id, integration_id, event_type, response_status_code, retry_count, dispatch_status, dispatched_at';

// ── Row types (snake_case) ─────────────────────────────────────────────────

type WorkflowRow = {
  id: string; organization_id: string; workflow_code: string; workflow_name: string;
  target_entity: string; is_active: boolean; created_at: string;
};

type StepRow = {
  id: string; workflow_id: string; step_order: number; step_name: string;
  required_role_id: string | null; approver_employee_id: string | null;
  allow_ai_auto_approval: boolean; timeout_hours: number; is_mandatory: boolean;
  created_at: string;
};

type InstanceRow = {
  id: string; workflow_id: string; organization_id: string; entity_id: string;
  current_step_order: number; instance_status: string; submitted_by: string | null;
  final_feedback: string | null; completed_at: string | null; created_at: string;
};

type StepLogRow = {
  id: string; instance_id: string; step_id: string; actor_employee_id: string | null;
  action_taken: string; comments: string | null; acted_at: string;
};

type PayrollRow = {
  id: string; organization_id: string; employee_id: string;
  pay_period_start: string; pay_period_end: string; pay_frequency: string;
  gross_salary: number; total_allowances: number; total_deductions: number;
  net_salary: number; currency: string; exchange_rate_to_usd: number;
  payout_method: string; payout_status: string; processed_at: string | null;
  created_at: string;
};

type LineItemRow = {
  id: string; payroll_id: string; item_type: string; item_name: string;
  amount: number; currency: string; is_taxable: boolean; created_at: string;
};

type PayrollTxRow = {
  id: string; payroll_id: string; organization_id: string;
  transaction_reference: string; amount_paid: number; currency: string;
  wallet_id: string | null; crypto_tx_hash: string | null;
  blockchain_network: string | null; status: string; transacted_at: string;
};

type ReportRow = {
  id: string; organization_id: string; report_title: string; report_category: string;
  export_formats: string[]; file_url: string | null; file_size_bytes: number;
  ai_summary_text: string | null; is_scheduled: boolean; recipient_emails: string[];
  generated_by: string | null; created_at: string;
};

type ReportScheduleRow = {
  id: string; report_id: string | null; organization_id: string; schedule_name: string;
  frequency_type: string; cron_expression: string; delivery_channels: string[];
  is_active: boolean; last_run_at: string | null; next_run_at: string | null;
  created_at: string;
};

type AuditLogRow = {
  id: string; organization_id: string; actor_employee_id: string | null;
  actor_user_id: string | null; action_type: string; target_resource: string;
  resource_id: string | null; severity_level: string; performed_at: string;
};

type IntegrationRow = {
  id: string; organization_id: string; integration_name: string;
  webhook_url: string | null; is_connected: boolean; sync_frequency_minutes: number;
  last_synced_at: string | null; created_at: string; updated_at: string;
};

type WebhookDispatchRow = {
  id: string; integration_id: string; event_type: string;
  response_status_code: number | null; retry_count: number;
  dispatch_status: string; dispatched_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapWorkflow(r: WorkflowRow): ApprovalWorkflow {
  return { id: r.id, organizationId: r.organization_id, workflowCode: r.workflow_code, workflowName: r.workflow_name, targetEntity: r.target_entity as ApprovalTargetEntity, isActive: r.is_active, createdAt: r.created_at };
}

function mapStep(r: StepRow): ApprovalStep {
  return { id: r.id, workflowId: r.workflow_id, stepOrder: r.step_order, stepName: r.step_name, requiredRoleId: r.required_role_id, approverEmployeeId: r.approver_employee_id, allowAiAutoApproval: r.allow_ai_auto_approval, timeoutHours: r.timeout_hours, isMandatory: r.is_mandatory, createdAt: r.created_at };
}

function mapInstance(r: InstanceRow): ApprovalWorkflowInstance {
  return { id: r.id, workflowId: r.workflow_id, organizationId: r.organization_id, entityId: r.entity_id, currentStepOrder: r.current_step_order, instanceStatus: r.instance_status as ApprovalInstanceStatus, submittedBy: r.submitted_by, finalFeedback: r.final_feedback, completedAt: r.completed_at, createdAt: r.created_at };
}

function mapStepLog(r: StepLogRow): ApprovalStepLog {
  return { id: r.id, instanceId: r.instance_id, stepId: r.step_id, actorEmployeeId: r.actor_employee_id, actionTaken: r.action_taken as ApprovalAction, comments: r.comments, actedAt: r.acted_at };
}

function mapPayroll(r: PayrollRow): Payroll {
  return { id: r.id, organizationId: r.organization_id, employeeId: r.employee_id, payPeriodStart: r.pay_period_start, payPeriodEnd: r.pay_period_end, payFrequency: r.pay_frequency as Payroll['payFrequency'], grossSalary: r.gross_salary, totalAllowances: r.total_allowances, totalDeductions: r.total_deductions, netSalary: r.net_salary, currency: r.currency, exchangeRateToUsd: r.exchange_rate_to_usd, payoutMethod: r.payout_method as Payroll['payoutMethod'], payoutStatus: r.payout_status as PayoutStatus, processedAt: r.processed_at, createdAt: r.created_at };
}

function mapLineItem(r: LineItemRow): PayrollLineItem {
  return { id: r.id, payrollId: r.payroll_id, itemType: r.item_type as PayrollLineItem['itemType'], itemName: r.item_name, amount: r.amount, currency: r.currency, isTaxable: r.is_taxable, createdAt: r.created_at };
}

function mapPayrollTx(r: PayrollTxRow): PayrollTransaction {
  return { id: r.id, payrollId: r.payroll_id, organizationId: r.organization_id, transactionReference: r.transaction_reference, amountPaid: r.amount_paid, currency: r.currency, walletId: r.wallet_id, cryptoTxHash: r.crypto_tx_hash, blockchainNetwork: r.blockchain_network, status: r.status as PayrollTransaction['status'], transactedAt: r.transacted_at };
}

function mapReport(r: ReportRow): EnterpriseReport {
  return { id: r.id, organizationId: r.organization_id, reportTitle: r.report_title, reportCategory: r.report_category as ReportCategory, exportFormats: r.export_formats, fileUrl: r.file_url, fileSizeBytes: r.file_size_bytes, aiSummaryText: r.ai_summary_text, isScheduled: r.is_scheduled, recipientEmails: r.recipient_emails, generatedBy: r.generated_by, createdAt: r.created_at };
}

function mapReportSchedule(r: ReportScheduleRow): EnterpriseReportSchedule {
  return { id: r.id, reportId: r.report_id, organizationId: r.organization_id, scheduleName: r.schedule_name, frequencyType: r.frequency_type as EnterpriseReportSchedule['frequencyType'], cronExpression: r.cron_expression, deliveryChannels: r.delivery_channels, isActive: r.is_active, lastRunAt: r.last_run_at, nextRunAt: r.next_run_at, createdAt: r.created_at };
}

function mapAuditLog(r: AuditLogRow): AuditLog {
  return { id: r.id, organizationId: r.organization_id, actorEmployeeId: r.actor_employee_id, actorUserId: r.actor_user_id, actionType: r.action_type, targetResource: r.target_resource, resourceId: r.resource_id, severityLevel: r.severity_level as AuditSeverityLevel, performedAt: r.performed_at };
}

function mapIntegration(r: IntegrationRow): EnterpriseIntegration {
  return { id: r.id, organizationId: r.organization_id, integrationName: r.integration_name as EnterpriseIntegration['integrationName'], webhookUrl: r.webhook_url, isConnected: r.is_connected, syncFrequencyMinutes: r.sync_frequency_minutes, lastSyncedAt: r.last_synced_at, createdAt: r.created_at, updatedAt: r.updated_at };
}

function mapWebhookDispatch(r: WebhookDispatchRow): EnterpriseWebhookDispatch {
  return { id: r.id, integrationId: r.integration_id, eventType: r.event_type, responseStatusCode: r.response_status_code, retryCount: r.retry_count, dispatchStatus: r.dispatch_status as WebhookDispatchStatus, dispatchedAt: r.dispatched_at };
}

// ================================================================
// === Approval Workflows
// ================================================================

export async function getOrgWorkflows(
  orgId: string,
  targetEntity?: ApprovalTargetEntity
): Promise<ApprovalWorkflow[]> {
  let q = supabase
    .from('approval_workflows')
    .select(WORKFLOW_COLS)
    .eq('organization_id', orgId)
    .eq('is_active', true);

  if (targetEntity) q = q.eq('target_entity', targetEntity);

  const { data, error } = await q.order('workflow_name', { ascending: true });
  if (error) throw error;
  return (data as WorkflowRow[]).map(mapWorkflow);
}

export async function getWorkflow(workflowId: string): Promise<ApprovalWorkflow | null> {
  const { data, error } = await supabase
    .from('approval_workflows')
    .select(WORKFLOW_COLS)
    .eq('id', workflowId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapWorkflow(data as WorkflowRow) : null;
}

export async function getWorkflowSteps(workflowId: string): Promise<ApprovalStep[]> {
  const { data, error } = await supabase
    .from('approval_steps')
    .select(STEP_COLS)
    .eq('workflow_id', workflowId)
    .order('step_order', { ascending: true });
  if (error) throw error;
  return (data as StepRow[]).map(mapStep);
}

export async function getEntityApprovalInstance(
  entityId: string
): Promise<ApprovalWorkflowInstance | null> {
  const { data, error } = await supabase
    .from('approval_workflow_instances')
    .select(INSTANCE_COLS)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapInstance(data as InstanceRow) : null;
}

export async function getMyPendingApprovals(
  orgId: string
): Promise<ApprovalWorkflowInstance[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: empData } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!empData) return [];
  const employeeId = (empData as { id: string }).id;

  // Fetch active instances in the org that are pending/in_progress
  const { data: instances, error } = await supabase
    .from('approval_workflow_instances')
    .select(INSTANCE_COLS)
    .eq('organization_id', orgId)
    .in('instance_status', ['pending', 'in_progress'])
    .order('created_at', { ascending: true });
  if (error) throw error;

  if (!instances?.length) return [];

  // Filter to instances where the current step targets this employee
  const allInstances = instances as InstanceRow[];
  const filtered: ApprovalWorkflowInstance[] = [];

  for (const inst of allInstances) {
    const { data: step } = await supabase
      .from('approval_steps')
      .select('approver_employee_id')
      .eq('workflow_id', inst.workflow_id)
      .eq('step_order', inst.current_step_order)
      .maybeSingle();

    if (step && (step as { approver_employee_id: string | null }).approver_employee_id === employeeId) {
      filtered.push(mapInstance(inst));
    }
  }

  return filtered;
}

export async function getInstanceLogs(instanceId: string): Promise<ApprovalStepLog[]> {
  const { data, error } = await supabase
    .from('approval_step_logs')
    .select(STEP_LOG_COLS)
    .eq('instance_id', instanceId)
    .order('acted_at', { ascending: true });
  if (error) throw error;
  return (data as StepLogRow[]).map(mapStepLog);
}

// Records an approval action. The actual workflow advancement (status update,
// next step notification) is handled by a backend Edge Function trigger.
export async function recordApprovalAction(payload: {
  instanceId: string;
  stepId: string;
  actionTaken: 'approved' | 'rejected' | 'escalated';
  comments?: string;
}): Promise<ApprovalStepLog> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { data: empData } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const employeeId = empData ? (empData as { id: string }).id : null;

  const { data, error } = await supabase
    .from('approval_step_logs')
    .insert({
      instance_id: payload.instanceId,
      step_id: payload.stepId,
      actor_employee_id: employeeId,
      action_taken: payload.actionTaken,
      comments: payload.comments ?? null,
    })
    .select(STEP_LOG_COLS)
    .single();
  if (error) throw error;
  return mapStepLog(data as StepLogRow);
}

// ================================================================
// === Payrolls (READ ONLY — all write/processing ops are backend-only)
// ================================================================

export async function getMyPayrolls(
  options: { status?: PayoutStatus; limit?: number; cursor?: string } = {}
): Promise<Payroll[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: empData } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!empData) return [];
  const employeeId = (empData as { id: string }).id;

  let q = supabase
    .from('payrolls')
    .select(PAYROLL_COLS)
    .eq('employee_id', employeeId);

  if (options.status) q = q.eq('payout_status', options.status);
  if (options.cursor) q = q.lt('pay_period_start', options.cursor);

  const { data, error } = await q
    .order('pay_period_start', { ascending: false })
    .limit(options.limit ?? 24);
  if (error) throw error;
  return (data as PayrollRow[]).map(mapPayroll);
}

export async function getPayroll(payrollId: string): Promise<Payroll | null> {
  const { data, error } = await supabase
    .from('payrolls')
    .select(PAYROLL_COLS)
    .eq('id', payrollId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPayroll(data as PayrollRow) : null;
}

export async function getPayrollLineItems(payrollId: string): Promise<PayrollLineItem[]> {
  const { data, error } = await supabase
    .from('payroll_line_items')
    .select(LINE_ITEM_COLS)
    .eq('payroll_id', payrollId)
    .order('item_type', { ascending: true });
  if (error) throw error;
  return (data as LineItemRow[]).map(mapLineItem);
}

export async function getPayrollTransactions(
  payrollId: string
): Promise<PayrollTransaction[]> {
  const { data, error } = await supabase
    .from('payroll_transactions')
    .select(PAYROLL_TX_COLS)
    .eq('payroll_id', payrollId)
    .order('transacted_at', { ascending: false });
  if (error) throw error;
  return (data as PayrollTxRow[]).map(mapPayrollTx);
}

export async function getPayrollTransaction(
  txId: string
): Promise<PayrollTransaction | null> {
  const { data, error } = await supabase
    .from('payroll_transactions')
    .select(PAYROLL_TX_COLS)
    .eq('id', txId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPayrollTx(data as PayrollTxRow) : null;
}

// ================================================================
// === Enterprise Reports (READ ONLY from frontend)
// ================================================================

export async function getOrgReports(
  orgId: string,
  options: { category?: ReportCategory; limit?: number; cursor?: string } = {}
): Promise<EnterpriseReport[]> {
  let q = supabase
    .from('enterprise_reports')
    .select(REPORT_COLS)
    .eq('organization_id', orgId);

  if (options.category) q = q.eq('report_category', options.category);
  if (options.cursor) q = q.lt('created_at', options.cursor);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ReportRow[]).map(mapReport);
}

export async function getReport(reportId: string): Promise<EnterpriseReport | null> {
  const { data, error } = await supabase
    .from('enterprise_reports')
    .select(REPORT_COLS)
    .eq('id', reportId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapReport(data as ReportRow) : null;
}

export async function getReportSchedules(
  orgId: string
): Promise<EnterpriseReportSchedule[]> {
  const { data, error } = await supabase
    .from('enterprise_report_schedules')
    .select('*')
    .eq('organization_id', orgId)
    .order('schedule_name', { ascending: true });
  if (error) throw error;
  return (data as ReportScheduleRow[]).map(mapReportSchedule);
}

// ================================================================
// === Audit Logs (READ ONLY — always)
// ================================================================

export async function getAuditLogs(
  orgId: string,
  options: {
    severity?: AuditSeverityLevel;
    resource?: string;
    actorEmployeeId?: string;
    from?: string;
    limit?: number;
    cursor?: string;
  } = {}
): Promise<AuditLog[]> {
  let q = supabase
    .from('audit_logs')
    .select(AUDIT_LOG_COLS)
    .eq('organization_id', orgId);

  if (options.severity) q = q.eq('severity_level', options.severity);
  if (options.resource) q = q.eq('target_resource', options.resource);
  if (options.actorEmployeeId) q = q.eq('actor_employee_id', options.actorEmployeeId);
  if (options.from) q = q.gte('performed_at', options.from);
  if (options.cursor) q = q.lt('performed_at', options.cursor);

  const { data, error } = await q
    .order('performed_at', { ascending: false })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as AuditLogRow[]).map(mapAuditLog);
}

export async function getResourceAuditHistory(
  orgId: string,
  targetResource: string,
  resourceId: string
): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(AUDIT_LOG_COLS)
    .eq('organization_id', orgId)
    .eq('target_resource', targetResource)
    .eq('resource_id', resourceId)
    .order('performed_at', { ascending: false });
  if (error) throw error;
  return (data as AuditLogRow[]).map(mapAuditLog);
}

// ================================================================
// === Enterprise Integrations (READ ONLY — writes are backend-only)
// ================================================================
//
// Connecting integrations, rotating credentials, and updating signing
// secrets must go through the backend (Render/Edge Function) to
// safely encrypt and store credentials. Frontend only reads status.

export async function getOrgIntegrations(
  orgId: string
): Promise<EnterpriseIntegration[]> {
  const { data, error } = await supabase
    .from('enterprise_integrations')
    .select(INTEGRATION_COLS)
    .eq('organization_id', orgId)
    .order('integration_name', { ascending: true });
  if (error) throw error;
  return (data as IntegrationRow[]).map(mapIntegration);
}

export async function getIntegration(
  integrationId: string
): Promise<EnterpriseIntegration | null> {
  const { data, error } = await supabase
    .from('enterprise_integrations')
    .select(INTEGRATION_COLS)
    .eq('id', integrationId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapIntegration(data as IntegrationRow) : null;
}

export async function getWebhookDispatches(
  integrationId: string,
  options: {
    status?: WebhookDispatchStatus;
    limit?: number;
    cursor?: string;
  } = {}
): Promise<EnterpriseWebhookDispatch[]> {
  let q = supabase
    .from('enterprise_webhook_dispatches')
    .select(WEBHOOK_DISPATCH_COLS)
    .eq('integration_id', integrationId);

  if (options.status) q = q.eq('dispatch_status', options.status);
  if (options.cursor) q = q.lt('dispatched_at', options.cursor);

  const { data, error } = await q
    .order('dispatched_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as WebhookDispatchRow[]).map(mapWebhookDispatch);
}
