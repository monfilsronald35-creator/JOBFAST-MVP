// ─── Enterprise Organization Types ───────────────────────────────────────────

export type OrgType =
  | 'company' | 'government' | 'ngo' | 'university'
  | 'hospital' | 'telecom' | 'bank' | 'insurance'
  | 'restaurant' | 'hotel' | 'individual' | 'other';

export type OrgStatus = 'active' | 'suspended' | 'pending_verification' | 'closed';
export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export' | 'manage';
export type PermissionResource =
  | 'listings' | 'orders' | 'payments' | 'employees' | 'branches'
  | 'departments' | 'analytics' | 'settings' | 'plugins' | 'api_keys'
  | 'customers' | 'vendors' | 'inventory' | 'promotions' | 'audit_logs';

export interface Permission {
  resource:    PermissionResource;
  actions:     PermissionAction[];
  conditions?: Record<string, unknown>;
  scope?:      'own' | 'team' | 'department' | 'branch' | 'org' | 'global';
}

export interface Role {
  id:          string;
  orgId:       string;
  name:        string;
  description?: string;
  permissions: Permission[];
  isSystem:    boolean;
  createdAt:   number;
}

export interface OrgAddress {
  street:     string;
  city:       string;
  state?:     string;
  country:    string;
  postalCode: string;
  lat?:       number;
  lng?:       number;
}

export interface OrgContact {
  email:   string;
  phone?:  string;
  website?: string;
}

export interface Team {
  id:         string;
  deptId:     string;
  name:       string;
  leadId?:    string;
  memberIds:  string[];
  createdAt:  number;
}

export interface Department {
  id:        string;
  branchId:  string;
  name:      string;
  headId?:   string;
  teamIds:   string[];
  createdAt: number;
}

export interface Branch {
  id:            string;
  orgId:         string;
  name:          string;
  code:          string;
  address:       OrgAddress;
  managerId?:    string;
  deptIds:       string[];
  isHeadquarters: boolean;
  timezone:      string;
  createdAt:     number;
}

export interface Employee {
  id:         string;
  orgId:      string;
  userId:     string;
  branchId?:  string;
  deptId?:    string;
  teamId?:    string;
  roleIds:    string[];
  title?:     string;
  status:     EmployeeStatus;
  hiredAt?:   number;
  createdAt:  number;
}

export interface OrgSettings {
  allowMultiAdmin:     boolean;
  requireApproval:     boolean;
  auditAllActions:     boolean;
  allowBranchAdmins:   boolean;
  inventoryTracking:   boolean;
  autoFulfillment:     boolean;
  defaultCurrency:     string;
  defaultLanguage:     string;
  taxId?:              string;
  vatNumber?:          string;
}

export interface Organization {
  id:              string;
  type:            OrgType;
  name:            string;
  legalName?:      string;
  displayName:     string;
  logo?:           string;
  banner?:         string;
  description?:    string;
  address:         OrgAddress;
  contact:         OrgContact;
  countryCode:     string;
  currencyCode:    string;
  status:          OrgStatus;
  ownerId:         string;
  adminIds:        string[];
  branchIds:       string[];
  employeeCount:   number;
  verifiedAt?:     number;
  settings:        OrgSettings;
  metadata:        Record<string, unknown>;
  createdAt:       number;
  updatedAt:       number;
}

export interface AuditLog {
  id:           string;
  orgId:        string;
  userId:       string;
  action:       string;
  resource:     PermissionResource;
  resourceId?:  string;
  before?:      unknown;
  after?:       unknown;
  ip?:          string;
  userAgent?:   string;
  severity:     'info' | 'warning' | 'critical';
  timestamp:    number;
}