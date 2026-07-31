// ── Organization ──────────────────────────────────────────────────────────────
export interface Organization {
  id:           string;
  name:         string;
  legalName?:   string | undefined;
  parentOrgId?: string | undefined;
  type:         OrgType;
  country:      string;
  currency:     string;
  timezone:     string;
  language:     string;
  logoUrl?:     string | undefined;
  website?:     string | undefined;
  email?:       string | undefined;
  phone?:       string | undefined;
  address?:     string | undefined;
  taxId?:       string | undefined;
  status:       'active' | 'suspended' | 'dissolved';
  ownerId:      string;
  createdAt:    string;
  updatedAt:    string;
}

export type OrgType = 'group' | 'company' | 'subsidiary' | 'branch_entity' | 'ngo' | 'government';

// ── Branch ────────────────────────────────────────────────────────────────────
export interface Branch {
  id:           string;
  orgId:        string;
  name:         string;
  code:         string;
  country:      string;
  city:         string;
  address?:     string | undefined;
  timezone:     string;
  language:     string;
  currency:     string;
  managerId?:   string | undefined;
  phone?:       string | undefined;
  email?:       string | undefined;
  status:       'active' | 'closed' | 'suspended';
  createdAt:    string;
}

// ── Department ────────────────────────────────────────────────────────────────
export interface Department {
  id:         string;
  orgId:      string;
  branchId?:  string | undefined;
  name:       string;
  code:       string;
  parentId?:  string | undefined;
  headId?:    string | undefined;
  budget?:    number | undefined;
  currency?:  string | undefined;
  status:     'active' | 'archived';
  createdAt:  string;
}

// ── Employee ──────────────────────────────────────────────────────────────────
export interface Employee {
  id:             string;
  orgId:          string;
  branchId?:      string | undefined;
  departmentId?:  string | undefined;
  userId:         string;
  employeeId:     string;
  type:           EmployeeType;
  roleId:         string;
  title:          string;
  managerId?:     string | undefined;
  startDate:      string;
  endDate?:       string | undefined;
  salary?:        number | undefined;
  hourlyRate?:    number | undefined;
  currency:       string;
  status:         'active' | 'on_leave' | 'terminated' | 'probation';
  createdAt:      string;
}

export type EmployeeType = 'full_time' | 'part_time' | 'contractor' | 'consultant' | 'intern';

// ── Roles & Permissions ────────────────────────────────────────────────────────
export interface EnterpriseRole {
  id:          string;
  orgId:       string;
  name:        string;
  description: string;
  isSystem:    boolean;
  permissions: Record<string, string[]>;
  createdAt:   string;
}

export const SYSTEM_ROLES = [
  'super_admin', 'regional_director', 'country_manager', 'branch_manager',
  'department_manager', 'hr_manager', 'finance_manager', 'recruiter',
  'cashier', 'receptionist', 'technician', 'support_agent', 'employee',
  'auditor', 'viewer',
] as const;

export type SystemRole = typeof SYSTEM_ROLES[number];

export const MODULE_PERMISSIONS: Record<string, string[]> = {
  employees:   ['read', 'create', 'update', 'delete', 'approve'],
  payroll:     ['read', 'create', 'approve', 'export'],
  invoices:    ['read', 'create', 'update', 'delete', 'approve', 'send'],
  reports:     ['read', 'export'],
  documents:   ['read', 'create', 'update', 'delete'],
  workflows:   ['read', 'create', 'approve', 'reject'],
  branches:    ['read', 'create', 'update', 'manage'],
  departments: ['read', 'create', 'update', 'delete'],
  settings:    ['read', 'update'],
  audit:       ['read'],
  ai:          ['read', 'query'],
};

// ── Payroll ────────────────────────────────────────────────────────────────────
export interface PayrollRecord {
  id:           string;
  orgId:        string;
  employeeId:   string;
  period:       string;
  grossAmount:  number;
  netAmount:    number;
  currency:     string;
  items:        PayrollItem[];
  status:       PayrollStatus;
  approvedBy?:  string | undefined;
  approvedAt?:  string | undefined;
  paidAt?:      string | undefined;
  createdAt:    string;
}

export interface PayrollItem {
  type:        'salary' | 'bonus' | 'overtime' | 'commission' | 'benefit' | 'tax' | 'deduction' | 'insurance';
  description: string;
  amount:      number;
  isCredit:    boolean;
}

export type PayrollStatus = 'draft' | 'pending_approval' | 'approved' | 'processing' | 'paid' | 'cancelled';

// ── Invoice ───────────────────────────────────────────────────────────────────
export interface Invoice {
  id:           string;
  orgId:        string;
  branchId?:    string | undefined;
  type:         InvoiceType;
  number:       string;
  clientName:   string;
  clientEmail?: string | undefined;
  items:        InvoiceItem[];
  subtotal:     number;
  taxAmount:    number;
  taxRate:      number;
  total:        number;
  currency:     string;
  status:       InvoiceStatus;
  dueDate?:     string | undefined;
  paidAt?:      string | undefined;
  notes?:       string | undefined;
  isRecurring:  boolean;
  recurringInterval?: 'monthly' | 'quarterly' | 'annually' | undefined;
  createdBy:    string;
  createdAt:    string;
}

export interface InvoiceItem {
  description: string;
  quantity:    number;
  unitPrice:   number;
  total:       number;
}

export type InvoiceType    = 'invoice' | 'quote' | 'purchase_order' | 'credit_note' | 'debit_note';
export type InvoiceStatus  = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';

// ── Workflow ──────────────────────────────────────────────────────────────────
export interface Workflow {
  id:          string;
  orgId:       string;
  name:        string;
  type:        WorkflowType;
  steps:       WorkflowStep[];
  isActive:    boolean;
  createdAt:   string;
}

export interface WorkflowStep {
  order:        number;
  approverRole: string;
  approverId?:  string | undefined;
  label:        string;
  timeoutHours?: number | undefined;
}

export interface WorkflowInstance {
  id:            string;
  workflowId:    string;
  orgId:         string;
  entityType:    string;
  entityId:      string;
  currentStep:   number;
  status:        'pending' | 'approved' | 'rejected' | 'cancelled';
  submittedBy:   string;
  completedAt?:  string | undefined;
  createdAt:     string;
  steps:         WorkflowInstanceStep[];
}

export interface WorkflowInstanceStep {
  order:       number;
  label:       string;
  approvedBy?: string | undefined;
  status:      'pending' | 'approved' | 'rejected' | 'skipped';
  decidedAt?:  string | undefined;
  comment?:    string | undefined;
}

export type WorkflowType = 'payroll_approval' | 'invoice_approval' | 'leave_request' |
  'expense_claim' | 'hiring' | 'procurement' | 'general';

// ── Document ──────────────────────────────────────────────────────────────────
export interface EnterpriseDocument {
  id:           string;
  orgId:        string;
  branchId?:    string | undefined;
  departmentId?: string | undefined;
  employeeId?:  string | undefined;
  category:     DocCategory;
  name:         string;
  fileUrl:      string;
  fileSize:     number;
  mimeType:     string;
  version:      number;
  tags:         string[];
  isConfidential: boolean;
  expiresAt?:   string | undefined;
  uploadedBy:   string;
  createdAt:    string;
}

export type DocCategory = 'contract' | 'invoice' | 'employee_file' | 'policy' |
  'report' | 'certificate' | 'license' | 'purchase_order' | 'legal';

// ── Audit Log ─────────────────────────────────────────────────────────────────
export interface AuditLog {
  id:         string;
  orgId:      string;
  userId:     string;
  action:     string;
  entity:     string;
  entityId:   string;
  before?:    Record<string, unknown> | undefined;
  after?:     Record<string, unknown> | undefined;
  ip?:        string | undefined;
  device?:    string | undefined;
  country?:   string | undefined;
  branchId?:  string | undefined;
  createdAt:  string;
}

// ── Security ──────────────────────────────────────────────────────────────────
export interface SecuritySettings {
  orgId:              string;
  ssoEnabled:         boolean;
  ssoProvider?:       string | undefined;
  mfaRequired:        boolean;
  mfaMethod:          'totp' | 'sms' | 'email';
  ipWhitelist:        string[];
  sessionTimeoutMin:  number;
  maxLoginAttempts:   number;
  requireStrongPw:    boolean;
  updatedAt:          string;
}

export interface TrustedDevice {
  id:         string;
  userId:     string;
  orgId:      string;
  deviceId:   string;
  deviceName: string;
  userAgent:  string;
  ip:         string;
  trustedAt:  string;
  expiresAt:  string;
}

// ── Report ────────────────────────────────────────────────────────────────────
export interface EnterpriseReport {
  orgId:        string;
  period:       string;
  generatedAt:  string;
  revenue:      number;
  expenses:     number;
  profit:       number;
  headcount:    number;
  payrollTotal: number;
  openPositions: number;
  branches:     BranchSummary[];
  departments:  DeptSummary[];
  currency:     string;
}

export interface BranchSummary {
  branchId:   string;
  name:       string;
  revenue:    number;
  headcount:  number;
}

export interface DeptSummary {
  deptId:    string;
  name:      string;
  headcount: number;
  budget:    number;
  spent:     number;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface EnterpriseDashboard {
  orgId:          string;
  orgName:        string;
  globalRevenue:  number;
  currency:       string;
  headcount:      number;
  openPositions:  number;
  branches:       BranchSummary[];
  payrollStatus:  string;
  riskAlerts:     string[];
  aiInsights:     string[];
  generatedAt:    string;
}