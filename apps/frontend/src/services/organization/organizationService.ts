import { supabase } from '../../lib/supabase';
import type {
  Organization,
  OrgType,
  OrganizationSetting,
  Branch,
  BranchStatus,
  Department,
  Role,
  RoleCategory,
  Permission,
  PermissionModule,
  RolePermission,
  AccessRule,
  UserOrganizationRole,
} from '../../types/organization';

// Backend-only fields (never queried from frontend):
//   organizations:      tax_identification_number, vat_number — sensitive tax data
//                       billing_address — financial PII
//                       ai_configuration — proprietary internal AI config
//                       security_policy — internal security rules
//   branches:           emergency_contact — PII (personal emergency contact details)
//   departments:        allocated_budget, consumed_budget — internal financial data
//   role_permissions:   condition_rules — internal access control logic
//   organization_settings: is_encrypted=true rows — encrypted values never returned

// ── Column constants (sensitive fields excluded) ───────────────────────────

const ORG_COLS =
  'id, parent_organization_id, org_name, legal_name, org_type, registration_number, billing_email, country_code, timezone, default_currency, supported_languages, fiscal_year_start_month, branding_config, compliance_frameworks, is_active, created_at, updated_at';
// tax_identification_number, vat_number, billing_address, ai_configuration, security_policy excluded

const BRANCH_COLS =
  'id, organization_id, branch_name, branch_code, country_code, state_province, city_name, postal_code, address_line, gps_coordinates, geo_fence_radius_meters, timezone, opening_hours, max_capacity, manager_id, branch_status, created_at, updated_at';
// emergency_contact excluded — PII

const DEPT_COLS =
  'id, organization_id, branch_id, parent_department_id, department_name, cost_center_code, currency, department_head_id, ai_manager_agent_id, active_projects_count, department_kpis, created_at, updated_at';
// allocated_budget, consumed_budget excluded — internal financial data

const ROLE_PERM_COLS =
  'id, role_id, permission_id, access_rule, is_inherited, is_temporary, expires_at, created_at';
// condition_rules excluded — internal access control logic

// ── Row types (snake_case) ─────────────────────────────────────────────────

type OrgRow = {
  id: string; parent_organization_id: string | null; org_name: string; legal_name: string;
  org_type: string; registration_number: string; billing_email: string;
  country_code: string; timezone: string; default_currency: string;
  supported_languages: string[]; fiscal_year_start_month: number;
  branding_config: Record<string, unknown>; compliance_frameworks: string[];
  is_active: boolean; created_at: string; updated_at: string;
};

type OrgSettingRow = {
  id: string; organization_id: string; setting_key: string;
  setting_value: Record<string, unknown>; is_encrypted: boolean;
  updated_by: string | null; created_at: string; updated_at: string;
};

type BranchRow = {
  id: string; organization_id: string; branch_name: string; branch_code: string;
  country_code: string; state_province: string | null; city_name: string | null;
  postal_code: string | null; address_line: string | null;
  gps_coordinates: string | null; geo_fence_radius_meters: number;
  timezone: string; opening_hours: Record<string, unknown>;
  max_capacity: number; manager_id: string | null;
  branch_status: string; created_at: string; updated_at: string;
};

type DeptRow = {
  id: string; organization_id: string; branch_id: string | null;
  parent_department_id: string | null; department_name: string;
  cost_center_code: string; currency: string; department_head_id: string | null;
  ai_manager_agent_id: string | null; active_projects_count: number;
  department_kpis: Record<string, unknown>; created_at: string; updated_at: string;
};

type RoleRow = {
  id: string; organization_id: string | null; role_code: string; role_name: string;
  role_category: string; description: string | null;
  is_system_default: boolean; hierarchy_level: number; created_at: string;
};

type PermissionRow = {
  id: string; permission_key: string; module_name: string;
  description: string | null; risk_level: string; created_at: string;
};

type RolePermRow = {
  id: string; role_id: string; permission_id: string; access_rule: string;
  is_inherited: boolean; is_temporary: boolean;
  expires_at: string | null; created_at: string;
};

type UserOrgRoleRow = {
  id: string; user_id: string; organization_id: string; branch_id: string | null;
  role_id: string; is_primary: boolean; assigned_by: string | null; assigned_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapOrg(r: OrgRow): Organization {
  return { id: r.id, parentOrganizationId: r.parent_organization_id, orgName: r.org_name, legalName: r.legal_name, orgType: r.org_type as OrgType, registrationNumber: r.registration_number, billingEmail: r.billing_email, countryCode: r.country_code, timezone: r.timezone, defaultCurrency: r.default_currency, supportedLanguages: r.supported_languages, fiscalYearStartMonth: r.fiscal_year_start_month, brandingConfig: r.branding_config, complianceFrameworks: r.compliance_frameworks, isActive: r.is_active, createdAt: r.created_at, updatedAt: r.updated_at };
}

function mapOrgSetting(r: OrgSettingRow): OrganizationSetting {
  return { id: r.id, organizationId: r.organization_id, settingKey: r.setting_key, settingValue: r.setting_value, isEncrypted: r.is_encrypted, updatedBy: r.updated_by, createdAt: r.created_at, updatedAt: r.updated_at };
}

function mapBranch(r: BranchRow): Branch {
  return { id: r.id, organizationId: r.organization_id, branchName: r.branch_name, branchCode: r.branch_code, countryCode: r.country_code, stateProvince: r.state_province, cityName: r.city_name, postalCode: r.postal_code, addressLine: r.address_line, gpsCoordinates: r.gps_coordinates, geoFenceRadiusMeters: r.geo_fence_radius_meters, timezone: r.timezone, openingHours: r.opening_hours, maxCapacity: r.max_capacity, managerId: r.manager_id, branchStatus: r.branch_status as BranchStatus, createdAt: r.created_at, updatedAt: r.updated_at };
}

function mapDept(r: DeptRow): Department {
  return { id: r.id, organizationId: r.organization_id, branchId: r.branch_id, parentDepartmentId: r.parent_department_id, departmentName: r.department_name, costCenterCode: r.cost_center_code, currency: r.currency, departmentHeadId: r.department_head_id, aiManagerAgentId: r.ai_manager_agent_id, activeProjectsCount: r.active_projects_count, departmentKpis: r.department_kpis, createdAt: r.created_at, updatedAt: r.updated_at };
}

function mapRole(r: RoleRow): Role {
  return { id: r.id, organizationId: r.organization_id, roleCode: r.role_code, roleName: r.role_name, roleCategory: r.role_category as RoleCategory, description: r.description, isSystemDefault: r.is_system_default, hierarchyLevel: r.hierarchy_level, createdAt: r.created_at };
}

function mapPermission(r: PermissionRow): Permission {
  return { id: r.id, permissionKey: r.permission_key, moduleName: r.module_name as PermissionModule, description: r.description, riskLevel: r.risk_level as Permission['riskLevel'], createdAt: r.created_at };
}

function mapRolePerm(r: RolePermRow): RolePermission {
  return { id: r.id, roleId: r.role_id, permissionId: r.permission_id, accessRule: r.access_rule as AccessRule, isInherited: r.is_inherited, isTemporary: r.is_temporary, expiresAt: r.expires_at, createdAt: r.created_at };
}

function mapUserOrgRole(r: UserOrgRoleRow): UserOrganizationRole {
  return { id: r.id, userId: r.user_id, organizationId: r.organization_id, branchId: r.branch_id, roleId: r.role_id, isPrimary: r.is_primary, assignedBy: r.assigned_by, assignedAt: r.assigned_at };
}

// ================================================================
// === Organizations
// ================================================================

export async function getMyOrganizations(): Promise<Organization[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: bindings, error: bErr } = await supabase
    .from('user_organization_roles')
    .select('organization_id')
    .eq('user_id', user.id);
  if (bErr) throw bErr;
  if (!bindings?.length) return [];

  const orgIds = [...new Set((bindings as { organization_id: string }[]).map(r => r.organization_id))];

  const { data, error } = await supabase
    .from('organizations')
    .select(ORG_COLS)
    .in('id', orgIds)
    .eq('is_active', true)
    .order('org_name', { ascending: true });
  if (error) throw error;
  return (data as OrgRow[]).map(mapOrg);
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select(ORG_COLS)
    .eq('id', orgId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapOrg(data as OrgRow) : null;
}

export async function getChildOrganizations(parentOrgId: string): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select(ORG_COLS)
    .eq('parent_organization_id', parentOrgId)
    .eq('is_active', true)
    .order('org_name', { ascending: true });
  if (error) throw error;
  return (data as OrgRow[]).map(mapOrg);
}

// Encrypted settings are never returned — filtered by is_encrypted = false.
export async function getOrganizationSettings(
  orgId: string
): Promise<OrganizationSetting[]> {
  const { data, error } = await supabase
    .from('organization_settings')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_encrypted', false)
    .order('setting_key', { ascending: true });
  if (error) throw error;
  return (data as OrgSettingRow[]).map(mapOrgSetting);
}

export async function getOrganizationSetting(
  orgId: string,
  settingKey: string
): Promise<OrganizationSetting | null> {
  const { data, error } = await supabase
    .from('organization_settings')
    .select('*')
    .eq('organization_id', orgId)
    .eq('setting_key', settingKey)
    .eq('is_encrypted', false)
    .maybeSingle();
  if (error) throw error;
  return data ? mapOrgSetting(data as OrgSettingRow) : null;
}

// ================================================================
// === Branches
// ================================================================

export async function getOrgBranches(
  orgId: string,
  status?: BranchStatus
): Promise<Branch[]> {
  let q = supabase
    .from('branches')
    .select(BRANCH_COLS)
    .eq('organization_id', orgId);
  if (status) q = q.eq('branch_status', status);

  const { data, error } = await q.order('branch_name', { ascending: true });
  if (error) throw error;
  return (data as BranchRow[]).map(mapBranch);
}

export async function getBranch(branchId: string): Promise<Branch | null> {
  const { data, error } = await supabase
    .from('branches')
    .select(BRANCH_COLS)
    .eq('id', branchId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBranch(data as BranchRow) : null;
}

// ================================================================
// === Departments
// ================================================================

export async function getOrgDepartments(
  orgId: string,
  branchId?: string
): Promise<Department[]> {
  let q = supabase
    .from('departments')
    .select(DEPT_COLS)
    .eq('organization_id', orgId);
  if (branchId) q = q.eq('branch_id', branchId);

  const { data, error } = await q.order('department_name', { ascending: true });
  if (error) throw error;
  return (data as DeptRow[]).map(mapDept);
}

export async function getDepartment(deptId: string): Promise<Department | null> {
  const { data, error } = await supabase
    .from('departments')
    .select(DEPT_COLS)
    .eq('id', deptId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDept(data as DeptRow) : null;
}

export async function getDepartmentTree(
  orgId: string,
  parentDeptId?: string
): Promise<Department[]> {
  let q = supabase
    .from('departments')
    .select(DEPT_COLS)
    .eq('organization_id', orgId);

  q = parentDeptId
    ? q.eq('parent_department_id', parentDeptId)
    : q.is('parent_department_id', null);

  const { data, error } = await q.order('department_name', { ascending: true });
  if (error) throw error;
  return (data as DeptRow[]).map(mapDept);
}

// ================================================================
// === Roles
// ================================================================

export async function getRoles(
  options: { orgId?: string; category?: RoleCategory } = {}
): Promise<Role[]> {
  let q = supabase
    .from('roles')
    .select('*');
  if (options.orgId) q = q.eq('organization_id', options.orgId);
  if (options.category) q = q.eq('role_category', options.category);

  const { data, error } = await q.order('hierarchy_level', { ascending: true });
  if (error) throw error;
  return (data as RoleRow[]).map(mapRole);
}

export async function getRole(roleId: string): Promise<Role | null> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('id', roleId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRole(data as RoleRow) : null;
}

// ================================================================
// === Permissions
// ================================================================

export async function getPermissions(
  module?: PermissionModule
): Promise<Permission[]> {
  let q = supabase
    .from('permissions')
    .select('*');
  if (module) q = q.eq('module_name', module);

  const { data, error } = await q.order('permission_key', { ascending: true });
  if (error) throw error;
  return (data as PermissionRow[]).map(mapPermission);
}

// Filters out expired temporary grants automatically.
export async function getRolePermissions(roleId: string): Promise<RolePermission[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('role_permissions')
    .select(ROLE_PERM_COLS)
    .eq('role_id', roleId)
    .or(`is_temporary.eq.false,expires_at.gt.${now}`);
  if (error) throw error;
  return (data as RolePermRow[]).map(mapRolePerm);
}

// ================================================================
// === User Organization Roles
// ================================================================

export async function getMyOrgRoles(): Promise<UserOrganizationRole[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_organization_roles')
    .select('*')
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false });
  if (error) throw error;
  return (data as UserOrgRoleRow[]).map(mapUserOrgRole);
}

export async function getMyPrimaryRoleInOrg(
  orgId: string
): Promise<UserOrganizationRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_organization_roles')
    .select('*')
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .eq('is_primary', true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapUserOrgRole(data as UserOrgRoleRow) : null;
}

export async function getOrgMembers(
  orgId: string,
  branchId?: string
): Promise<UserOrganizationRole[]> {
  let q = supabase
    .from('user_organization_roles')
    .select('*')
    .eq('organization_id', orgId);
  if (branchId) q = q.eq('branch_id', branchId);

  const { data, error } = await q.order('assigned_at', { ascending: false });
  if (error) throw error;
  return (data as UserOrgRoleRow[]).map(mapUserOrgRole);
}
