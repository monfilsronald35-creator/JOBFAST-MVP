// ─── Marketplace Automation Types ────────────────────────────────────────────

export type TriggerEvent =
  | 'order.created'
  | 'order.paid'
  | 'order.confirmed'
  | 'order.shipped'
  | 'order.delivered'
  | 'order.cancelled'
  | 'order.refunded'
  | 'payment.completed'
  | 'payment.failed'
  | 'listing.published'
  | 'listing.out_of_stock'
  | 'listing.low_stock'
  | 'customer.registered'
  | 'review.submitted'
  | 'vendor.approved'
  | 'vendor.suspended'
  | 'inventory.depleted'
  | 'subscription.renewed'
  | 'subscription.cancelled'
  | 'ticket.redeemed'
  | 'appointment.booked'
  | 'appointment.completed'
  | 'topup.activated'
  | 'invoice.created'
  | 'custom';

export type ActionType =
  | 'send_notification'
  | 'send_email'
  | 'send_sms'
  | 'send_webhook'
  | 'update_inventory'
  | 'update_wallet'
  | 'create_invoice'
  | 'generate_voucher'
  | 'activate_service'
  | 'update_analytics'
  | 'update_order_status'
  | 'trigger_fulfillment'
  | 'apply_discount'
  | 'call_api'
  | 'run_plugin'
  | 'log_event';

export type WorkflowStatus = 'active' | 'inactive' | 'draft' | 'error';

export interface TriggerCondition {
  field:     string;
  operator:  'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value:     unknown;
}

export interface Trigger {
  event:       TriggerEvent;
  conditions?: TriggerCondition[];
  debounceMs?: number;
}

export interface ActionConfig {
  type:       ActionType;
  params:     Record<string, unknown>;
  retryMax?:  number;
  timeoutMs?: number;
  onError?:   'skip' | 'halt' | 'notify';
}

export interface WorkflowStep {
  id:       string;
  name:     string;
  action:   ActionConfig;
  delayMs?: number;
  parallel?: boolean;
  condition?: TriggerCondition;
}

export interface Workflow {
  id:          string;
  orgId?:      string;
  vendorId?:   string;
  name:        string;
  description?: string;
  trigger:     Trigger;
  steps:       WorkflowStep[];
  status:      WorkflowStatus;
  runCount:    number;
  errorCount:  number;
  lastRunAt?:  number;
  createdAt:   number;
  updatedAt:   number;
}

export interface WorkflowRun {
  id:          string;
  workflowId:  string;
  triggeredBy: TriggerEvent;
  context:     Record<string, unknown>;
  status:      'running' | 'completed' | 'failed' | 'skipped';
  steps:       StepResult[];
  startedAt:   number;
  completedAt?: number;
  error?:      string;
}

export interface StepResult {
  stepId:     string;
  status:     'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?:    unknown;
  error?:     string;
  durationMs?: number;
  startedAt:  number;
  completedAt?: number;
}