// ── Organizations ──────────────────────────────────────────────────────────

export const ORG_TYPES = [
  'parent', 'subsidiary', 'franchise', 'ngo', 'government', 'startup', 'enterprise', 'holding',
] as const;
export type OrgType = typeof ORG_TYPES[number];

export interface Organization {
  id: string;
  parentOrganizationId: string | null;
  orgName: string;
  legalName: string;
  orgType: OrgType;
  registrationNumber: string;
  billingEmail: string;
  countryCode: string;
  timezone: string;
  defaultCurrency: string;
  supportedLanguages: string[];
  fiscalYearStartMonth: number;
  brandingConfig: Record<string, unknown>;
  complianceFrameworks: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // tax_identification_number excluded — sensitive tax data
  // vat_number excluded — sensitive tax data
  // billing_address excluded — financial PII
  // ai_configuration excluded — proprietary internal AI config
  // security_policy excluded — internal security rules (never expose)
}

export interface OrganizationSetting {
  id: string;
  organizationId: string;
  settingKey: string;
  settingValue: Record<string, unknown>;
  isEncrypted: boolean;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  // Only non-encrypted settings (is_encrypted = false) are ever returned to frontend
}

// ── Branches ───────────────────────────────────────────────────────────────

export const BRANCH_STATUSES = [
  'active', 'inactive', 'maintenance', 'closed', 'expansion',
] as const;
export type BranchStatus = typeof BRANCH_STATUSES[number];

export interface Branch {
  id: string;
  organizationId: string;
  branchName: string;
  branchCode: string;
  countryCode: string;
  stateProvince: string | null;
  cityName: string | null;
  postalCode: string | null;
  addressLine: string | null;
  gpsCoordinates: string | null; // PostgreSQL POINT serialized as "(x,y)" by PostgREST
  geoFenceRadiusMeters: number;
  timezone: string;
  openingHours: Record<string, unknown>;
  maxCapacity: number;
  managerId: string | null;
  branchStatus: BranchStatus;
  createdAt: string;
  updatedAt: string;
  // emergency_contact excluded — PII (personal emergency contact details)
}

// ── Departments ────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  organizationId: string;
  branchId: string | null;
  parentDepartmentId: string | null;
  departmentName: string;
  costCenterCode: string;
  currency: string;
  departmentHeadId: string | null;
  aiManagerAgentId: string | null;
  activeProjectsCount: number;
  departmentKpis: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  // allocated_budget, consumed_budget excluded — internal financial data
}

// ── Roles ─────────────────────────────────────────────────────────────────

export const ROLE_CATEGORIES = [
  'system', 'organization', 'marketplace', 'ai', 'global', 'branch', 'department',
] as const;
export type RoleCategory = typeof ROLE_CATEGORIES[number];

export interface Role {
  id: string;
  organizationId: string | null;
  roleCode: string;
  roleName: string;
  roleCategory: RoleCategory;
  description: string | null;
  isSystemDefault: boolean;
  hierarchyLevel: number;
  createdAt: string;
}

// ── Permissions ────────────────────────────────────────────────────────────

export const PERMISSION_MODULES = [
  'users', 'jobs', 'marketplace', 'wallet', 'ai', 'search', 'notification',
  'payment', 'admin', 'hotel', 'restaurant', 'legal', 'medical', 'enterprise',
  'payroll', 'analytics',
] as const;
export type PermissionModule = typeof PERMISSION_MODULES[number];

export const PERMISSION_RISK_LEVELS = ['low', 'medium', 'high', 'critical', 'quantum'] as const;
export type PermissionRiskLevel = typeof PERMISSION_RISK_LEVELS[number];

export interface Permission {
  id: string;
  permissionKey: string;
  moduleName: PermissionModule;
  description: string | null;
  riskLevel: PermissionRiskLevel;
  createdAt: string;
}

// ── Role Permissions ───────────────────────────────────────────────────────

export const ACCESS_RULES = ['allow', 'deny', 'conditional'] as const;
export type AccessRule = typeof ACCESS_RULES[number];

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  accessRule: AccessRule;
  isInherited: boolean;
  isTemporary: boolean;
  expiresAt: string | null;
  createdAt: string;
  // condition_rules excluded — internal access control logic (never expose to frontend)
}

// ── User Organization Roles ────────────────────────────────────────────────

export interface UserOrganizationRole {
  id: string;
  userId: string;
  organizationId: string;
  branchId: string | null;
  roleId: string;
  isPrimary: boolean;
  assignedBy: string | null;
  assignedAt: string;
}
