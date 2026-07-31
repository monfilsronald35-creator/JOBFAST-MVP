import { db } from '../../../core/database/SupabaseClient.js';
import type {
  Organization, Branch, Department, Employee, EnterpriseRole,
  PayrollRecord, Invoice, Workflow, WorkflowInstance,
  EnterpriseDocument, AuditLog, SecuritySettings, TrustedDevice,
} from '../types/enterprise.types.js';

// ── Organizations ──────────────────────────────────────────────────────────────
export const EnterpriseRepository = {
  async createOrg(org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
    const { data, error } = await db.client().from('ent_organizations').insert({
      name: org.name, legal_name: org.legalName, parent_org_id: org.parentOrgId,
      type: org.type, country: org.country, currency: org.currency,
      timezone: org.timezone, language: org.language, logo_url: org.logoUrl,
      website: org.website, email: org.email, phone: org.phone,
      address: org.address, tax_id: org.taxId, status: org.status, owner_id: org.ownerId,
    }).select().single();
    if (error) throw error;
    return mapOrg(data as Record<string, unknown>);
  },

  async getOrg(id: string): Promise<Organization | null> {
    const { data } = await db.client().from('ent_organizations').select('*').eq('id', id).single();
    return data ? mapOrg(data as Record<string, unknown>) : null;
  },

  async listOrgs(ownerId: string): Promise<Organization[]> {
    const { data } = await db.client().from('ent_organizations').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false });
    return (data ?? []).map(r => mapOrg(r as Record<string, unknown>));
  },

  async listChildren(parentOrgId: string): Promise<Organization[]> {
    const { data } = await db.client().from('ent_organizations').select('*').eq('parent_org_id', parentOrgId);
    return (data ?? []).map(r => mapOrg(r as Record<string, unknown>));
  },

  async updateOrg(id: string, patch: Partial<Organization>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (patch.name       !== undefined) row['name']         = patch.name;
    if (patch.status     !== undefined) row['status']       = patch.status;
    if (patch.logoUrl    !== undefined) row['logo_url']     = patch.logoUrl;
    if (patch.phone      !== undefined) row['phone']        = patch.phone;
    if (patch.email      !== undefined) row['email']        = patch.email;
    if (patch.address    !== undefined) row['address']      = patch.address;
    if (patch.currency   !== undefined) row['currency']     = patch.currency;
    if (patch.timezone   !== undefined) row['timezone']     = patch.timezone;
    if (patch.language   !== undefined) row['language']     = patch.language;
    await db.client().from('ent_organizations').update(row).eq('id', id);
  },

  // ── Branches ─────────────────────────────────────────────────────────────────
  async createBranch(b: Omit<Branch, 'id' | 'createdAt'>): Promise<Branch> {
    const { data, error } = await db.client().from('ent_branches').insert({
      org_id: b.orgId, name: b.name, code: b.code, country: b.country, city: b.city,
      address: b.address, timezone: b.timezone, language: b.language, currency: b.currency,
      manager_id: b.managerId, phone: b.phone, email: b.email, status: b.status,
    }).select().single();
    if (error) throw error;
    return mapBranch(data as Record<string, unknown>);
  },

  async listBranches(orgId: string): Promise<Branch[]> {
    const { data } = await db.client().from('ent_branches').select('*').eq('org_id', orgId).order('name');
    return (data ?? []).map(r => mapBranch(r as Record<string, unknown>));
  },

  async getBranch(id: string): Promise<Branch | null> {
    const { data } = await db.client().from('ent_branches').select('*').eq('id', id).single();
    return data ? mapBranch(data as Record<string, unknown>) : null;
  },

  async updateBranch(id: string, patch: Partial<Branch>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (patch.name      !== undefined) row['name']       = patch.name;
    if (patch.status    !== undefined) row['status']     = patch.status;
    if (patch.managerId !== undefined) row['manager_id'] = patch.managerId;
    if (patch.phone     !== undefined) row['phone']      = patch.phone;
    if (patch.email     !== undefined) row['email']      = patch.email;
    await db.client().from('ent_branches').update(row).eq('id', id);
  },

  // ── Departments ───────────────────────────────────────────────────────────────
  async createDept(d: Omit<Department, 'id' | 'createdAt'>): Promise<Department> {
    const { data, error } = await db.client().from('ent_departments').insert({
      org_id: d.orgId, branch_id: d.branchId, name: d.name, code: d.code,
      parent_id: d.parentId, head_id: d.headId, budget: d.budget, currency: d.currency, status: d.status,
    }).select().single();
    if (error) throw error;
    return mapDept(data as Record<string, unknown>);
  },

  async listDepts(orgId: string, branchId?: string): Promise<Department[]> {
    let q = db.client().from('ent_departments').select('*').eq('org_id', orgId);
    if (branchId) q = q.eq('branch_id', branchId);
    const { data } = await q.order('name');
    return (data ?? []).map(r => mapDept(r as Record<string, unknown>));
  },

  async getDept(id: string): Promise<Department | null> {
    const { data } = await db.client().from('ent_departments').select('*').eq('id', id).single();
    return data ? mapDept(data as Record<string, unknown>) : null;
  },

  // ── Roles ─────────────────────────────────────────────────────────────────────
  async createRole(r: Omit<EnterpriseRole, 'id' | 'createdAt'>): Promise<EnterpriseRole> {
    const { data, error } = await db.client().from('ent_roles').insert({
      org_id: r.orgId, name: r.name, description: r.description,
      is_system: r.isSystem, permissions: r.permissions,
    }).select().single();
    if (error) throw error;
    return mapRole(data as Record<string, unknown>);
  },

  async listRoles(orgId: string): Promise<EnterpriseRole[]> {
    const { data } = await db.client().from('ent_roles').select('*').eq('org_id', orgId).order('name');
    return (data ?? []).map(r => mapRole(r as Record<string, unknown>));
  },

  async getRole(id: string): Promise<EnterpriseRole | null> {
    const { data } = await db.client().from('ent_roles').select('*').eq('id', id).single();
    return data ? mapRole(data as Record<string, unknown>) : null;
  },

  // ── Employees ─────────────────────────────────────────────────────────────────
  async createEmployee(e: Omit<Employee, 'id' | 'createdAt'>): Promise<Employee> {
    const row: Record<string, unknown> = {
      org_id: e.orgId, user_id: e.userId, employee_id: e.employeeId, type: e.type,
      role_id: e.roleId, title: e.title, start_date: e.startDate, currency: e.currency, status: e.status,
    };
    if (e.branchId)     row['branch_id']     = e.branchId;
    if (e.departmentId) row['department_id'] = e.departmentId;
    if (e.managerId)    row['manager_id']    = e.managerId;
    if (e.salary)       row['salary']        = e.salary;
    if (e.hourlyRate)   row['hourly_rate']   = e.hourlyRate;
    const { data, error } = await db.client().from('ent_employees').insert(row).select().single();
    if (error) throw error;
    return mapEmployee(data as Record<string, unknown>);
  },

  async listEmployees(orgId: string, filters: { branchId?: string; deptId?: string; status?: string } = {}): Promise<Employee[]> {
    let q = db.client().from('ent_employees').select('*').eq('org_id', orgId);
    if (filters.branchId) q = q.eq('branch_id', filters.branchId);
    if (filters.deptId)   q = q.eq('department_id', filters.deptId);
    if (filters.status)   q = q.eq('status', filters.status);
    const { data } = await q.order('created_at', { ascending: false });
    return (data ?? []).map(r => mapEmployee(r as Record<string, unknown>));
  },

  async getEmployee(id: string): Promise<Employee | null> {
    const { data } = await db.client().from('ent_employees').select('*').eq('id', id).single();
    return data ? mapEmployee(data as Record<string, unknown>) : null;
  },

  async getEmployeeByUser(orgId: string, userId: string): Promise<Employee | null> {
    const { data } = await db.client().from('ent_employees').select('*').eq('org_id', orgId).eq('user_id', userId).single();
    return data ? mapEmployee(data as Record<string, unknown>) : null;
  },

  async updateEmployee(id: string, patch: Partial<Employee>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (patch.status       !== undefined) row['status']        = patch.status;
    if (patch.title        !== undefined) row['title']         = patch.title;
    if (patch.roleId       !== undefined) row['role_id']       = patch.roleId;
    if (patch.departmentId !== undefined) row['department_id'] = patch.departmentId;
    if (patch.branchId     !== undefined) row['branch_id']     = patch.branchId;
    if (patch.managerId    !== undefined) row['manager_id']    = patch.managerId;
    if (patch.salary       !== undefined) row['salary']        = patch.salary;
    if (patch.endDate      !== undefined) row['end_date']      = patch.endDate;
    await db.client().from('ent_employees').update(row).eq('id', id);
  },

  // ── Payroll ───────────────────────────────────────────────────────────────────
  async createPayroll(p: Omit<PayrollRecord, 'id' | 'createdAt'>): Promise<PayrollRecord> {
    const { data, error } = await db.client().from('ent_payroll').insert({
      org_id: p.orgId, employee_id: p.employeeId, period: p.period,
      gross_amount: p.grossAmount, net_amount: p.netAmount, currency: p.currency,
      items: p.items, status: p.status,
    }).select().single();
    if (error) throw error;
    return mapPayroll(data as Record<string, unknown>);
  },

  async listPayroll(orgId: string, period?: string): Promise<PayrollRecord[]> {
    let q = db.client().from('ent_payroll').select('*').eq('org_id', orgId);
    if (period) q = q.eq('period', period);
    const { data } = await q.order('created_at', { ascending: false });
    return (data ?? []).map(r => mapPayroll(r as Record<string, unknown>));
  },

  async updatePayrollStatus(id: string, status: PayrollRecord['status'], approvedBy?: string): Promise<void> {
    const row: Record<string, unknown> = { status };
    if (approvedBy) { row['approved_by'] = approvedBy; row['approved_at'] = new Date().toISOString(); }
    if (status === 'paid') row['paid_at'] = new Date().toISOString();
    await db.client().from('ent_payroll').update(row).eq('id', id);
  },

  // ── Invoices ──────────────────────────────────────────────────────────────────
  async createInvoice(inv: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice> {
    const row: Record<string, unknown> = {
      org_id: inv.orgId, type: inv.type, number: inv.number,
      client_name: inv.clientName, items: inv.items,
      subtotal: inv.subtotal, tax_amount: inv.taxAmount, tax_rate: inv.taxRate,
      total: inv.total, currency: inv.currency, status: inv.status,
      is_recurring: inv.isRecurring, created_by: inv.createdBy,
    };
    if (inv.branchId)           row['branch_id']           = inv.branchId;
    if (inv.clientEmail)        row['client_email']        = inv.clientEmail;
    if (inv.dueDate)            row['due_date']            = inv.dueDate;
    if (inv.notes)              row['notes']               = inv.notes;
    if (inv.recurringInterval)  row['recurring_interval']  = inv.recurringInterval;
    const { data, error } = await db.client().from('ent_invoices').insert(row).select().single();
    if (error) throw error;
    return mapInvoice(data as Record<string, unknown>);
  },

  async listInvoices(orgId: string, filters: { type?: string; status?: string } = {}): Promise<Invoice[]> {
    let q = db.client().from('ent_invoices').select('*').eq('org_id', orgId);
    if (filters.type)   q = q.eq('type', filters.type);
    if (filters.status) q = q.eq('status', filters.status);
    const { data } = await q.order('created_at', { ascending: false });
    return (data ?? []).map(r => mapInvoice(r as Record<string, unknown>));
  },

  async getInvoice(id: string): Promise<Invoice | null> {
    const { data } = await db.client().from('ent_invoices').select('*').eq('id', id).single();
    return data ? mapInvoice(data as Record<string, unknown>) : null;
  },

  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<void> {
    const row: Record<string, unknown> = { status };
    if (status === 'paid') row['paid_at'] = new Date().toISOString();
    await db.client().from('ent_invoices').update(row).eq('id', id);
  },

  // ── Workflows ─────────────────────────────────────────────────────────────────
  async createWorkflow(w: Omit<Workflow, 'id' | 'createdAt'>): Promise<Workflow> {
    const { data, error } = await db.client().from('ent_workflows').insert({
      org_id: w.orgId, name: w.name, type: w.type, steps: w.steps, is_active: w.isActive,
    }).select().single();
    if (error) throw error;
    return mapWorkflow(data as Record<string, unknown>);
  },

  async listWorkflows(orgId: string): Promise<Workflow[]> {
    const { data } = await db.client().from('ent_workflows').select('*').eq('org_id', orgId).eq('is_active', true);
    return (data ?? []).map(r => mapWorkflow(r as Record<string, unknown>));
  },

  async createWorkflowInstance(inst: Omit<WorkflowInstance, 'id' | 'createdAt'>): Promise<WorkflowInstance> {
    const { data, error } = await db.client().from('ent_workflow_instances').insert({
      workflow_id: inst.workflowId, org_id: inst.orgId, entity_type: inst.entityType,
      entity_id: inst.entityId, current_step: inst.currentStep, status: inst.status,
      submitted_by: inst.submittedBy, steps: inst.steps,
    }).select().single();
    if (error) throw error;
    return mapWFInstance(data as Record<string, unknown>);
  },

  async getWorkflowInstance(id: string): Promise<WorkflowInstance | null> {
    const { data } = await db.client().from('ent_workflow_instances').select('*').eq('id', id).single();
    return data ? mapWFInstance(data as Record<string, unknown>) : null;
  },

  async updateWorkflowInstance(id: string, patch: Partial<WorkflowInstance>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (patch.status      !== undefined) row['status']       = patch.status;
    if (patch.currentStep !== undefined) row['current_step'] = patch.currentStep;
    if (patch.steps       !== undefined) row['steps']        = patch.steps;
    if (patch.completedAt !== undefined) row['completed_at'] = patch.completedAt;
    await db.client().from('ent_workflow_instances').update(row).eq('id', id);
  },

  async listWorkflowInstances(orgId: string, status?: string): Promise<WorkflowInstance[]> {
    let q = db.client().from('ent_workflow_instances').select('*').eq('org_id', orgId);
    if (status) q = q.eq('status', status);
    const { data } = await q.order('created_at', { ascending: false });
    return (data ?? []).map(r => mapWFInstance(r as Record<string, unknown>));
  },

  // ── Documents ─────────────────────────────────────────────────────────────────
  async createDocument(doc: Omit<EnterpriseDocument, 'id' | 'createdAt'>): Promise<EnterpriseDocument> {
    const row: Record<string, unknown> = {
      org_id: doc.orgId, category: doc.category, name: doc.name,
      file_url: doc.fileUrl, file_size: doc.fileSize, mime_type: doc.mimeType,
      version: doc.version, tags: doc.tags, is_confidential: doc.isConfidential,
      uploaded_by: doc.uploadedBy,
    };
    if (doc.branchId)     row['branch_id']     = doc.branchId;
    if (doc.departmentId) row['department_id'] = doc.departmentId;
    if (doc.employeeId)   row['employee_id']   = doc.employeeId;
    if (doc.expiresAt)    row['expires_at']    = doc.expiresAt;
    const { data, error } = await db.client().from('ent_documents').insert(row).select().single();
    if (error) throw error;
    return mapDocument(data as Record<string, unknown>);
  },

  async listDocuments(orgId: string, filters: { category?: string; employeeId?: string } = {}): Promise<EnterpriseDocument[]> {
    let q = db.client().from('ent_documents').select('*').eq('org_id', orgId);
    if (filters.category)   q = q.eq('category', filters.category);
    if (filters.employeeId) q = q.eq('employee_id', filters.employeeId);
    const { data } = await q.order('created_at', { ascending: false });
    return (data ?? []).map(r => mapDocument(r as Record<string, unknown>));
  },

  // ── Audit Log ─────────────────────────────────────────────────────────────────
  async writeAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    const row: Record<string, unknown> = {
      org_id: log.orgId, user_id: log.userId, action: log.action,
      entity: log.entity, entity_id: log.entityId,
    };
    if (log.before)   row['before']    = log.before;
    if (log.after)    row['after']     = log.after;
    if (log.ip)       row['ip']        = log.ip;
    if (log.device)   row['device']    = log.device;
    if (log.country)  row['country']   = log.country;
    if (log.branchId) row['branch_id'] = log.branchId;
    await db.client().from('ent_audit_logs').insert(row);
  },

  async listAuditLogs(orgId: string, limit = 100, offset = 0): Promise<AuditLog[]> {
    const { data } = await db.client()
      .from('ent_audit_logs').select('*').eq('org_id', orgId)
      .order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    return (data ?? []).map(r => {
      const row = r as Record<string, unknown>;
      const log: AuditLog = {
        id:       String(row['id'] ?? ''),
        orgId,
        userId:   String(row['user_id'] ?? ''),
        action:   String(row['action'] ?? ''),
        entity:   String(row['entity'] ?? ''),
        entityId: String(row['entity_id'] ?? ''),
        createdAt: String(row['created_at'] ?? ''),
      };
      if (row['before'])    log.before   = row['before'] as Record<string, unknown>;
      if (row['after'])     log.after    = row['after'] as Record<string, unknown>;
      if (row['ip'])        log.ip       = String(row['ip']);
      if (row['device'])    log.device   = String(row['device']);
      if (row['country'])   log.country  = String(row['country']);
      if (row['branch_id']) log.branchId = String(row['branch_id']);
      return log;
    });
  },

  // ── Security ──────────────────────────────────────────────────────────────────
  async getSecuritySettings(orgId: string): Promise<SecuritySettings | null> {
    const { data } = await db.client().from('ent_security_settings').select('*').eq('org_id', orgId).single();
    if (!data) return null;
    const r = data as Record<string, unknown>;
    return {
      orgId,
      ssoEnabled:        Boolean(r['sso_enabled'] ?? false),
      mfaRequired:       Boolean(r['mfa_required'] ?? false),
      mfaMethod:         (r['mfa_method'] as SecuritySettings['mfaMethod']) ?? 'totp',
      ipWhitelist:       (r['ip_whitelist'] as string[]) ?? [],
      sessionTimeoutMin: Number(r['session_timeout_min'] ?? 480),
      maxLoginAttempts:  Number(r['max_login_attempts'] ?? 5),
      requireStrongPw:   Boolean(r['require_strong_pw'] ?? true),
      updatedAt:         String(r['updated_at'] ?? ''),
    };
  },

  async upsertSecuritySettings(s: SecuritySettings): Promise<void> {
    const row: Record<string, unknown> = {
      org_id: s.orgId, sso_enabled: s.ssoEnabled, mfa_required: s.mfaRequired,
      mfa_method: s.mfaMethod, ip_whitelist: s.ipWhitelist,
      session_timeout_min: s.sessionTimeoutMin, max_login_attempts: s.maxLoginAttempts,
      require_strong_pw: s.requireStrongPw, updated_at: new Date().toISOString(),
    };
    if (s.ssoProvider) row['sso_provider'] = s.ssoProvider;
    await db.client().from('ent_security_settings').upsert(row, { onConflict: 'org_id' });
  },
};

// ── Mappers ────────────────────────────────────────────────────────────────────
function mapOrg(r: Record<string, unknown>): Organization {
  const org: Organization = {
    id:        String(r['id'] ?? ''),
    name:      String(r['name'] ?? ''),
    type:      (r['type'] as Organization['type']) ?? 'company',
    country:   String(r['country'] ?? 'HT'),
    currency:  String(r['currency'] ?? 'HTG'),
    timezone:  String(r['timezone'] ?? 'America/Port-au-Prince'),
    language:  String(r['language'] ?? 'ht'),
    status:    (r['status'] as Organization['status']) ?? 'active',
    ownerId:   String(r['owner_id'] ?? ''),
    createdAt: String(r['created_at'] ?? ''),
    updatedAt: String(r['updated_at'] ?? ''),
  };
  if (r['legal_name'])    org.legalName    = String(r['legal_name']);
  if (r['parent_org_id']) org.parentOrgId  = String(r['parent_org_id']);
  if (r['logo_url'])      org.logoUrl      = String(r['logo_url']);
  if (r['website'])       org.website      = String(r['website']);
  if (r['email'])         org.email        = String(r['email']);
  if (r['phone'])         org.phone        = String(r['phone']);
  if (r['address'])       org.address      = String(r['address']);
  if (r['tax_id'])        org.taxId        = String(r['tax_id']);
  return org;
}

function mapBranch(r: Record<string, unknown>): Branch {
  const b: Branch = {
    id: String(r['id'] ?? ''), orgId: String(r['org_id'] ?? ''), name: String(r['name'] ?? ''),
    code: String(r['code'] ?? ''), country: String(r['country'] ?? 'HT'),
    city: String(r['city'] ?? ''), timezone: String(r['timezone'] ?? ''),
    language: String(r['language'] ?? 'ht'), currency: String(r['currency'] ?? 'HTG'),
    status: (r['status'] as Branch['status']) ?? 'active', createdAt: String(r['created_at'] ?? ''),
  };
  if (r['address'])    b.address    = String(r['address']);
  if (r['manager_id']) b.managerId  = String(r['manager_id']);
  if (r['phone'])      b.phone      = String(r['phone']);
  if (r['email'])      b.email      = String(r['email']);
  return b;
}

function mapDept(r: Record<string, unknown>): Department {
  const d: Department = {
    id: String(r['id'] ?? ''), orgId: String(r['org_id'] ?? ''), name: String(r['name'] ?? ''),
    code: String(r['code'] ?? ''), status: (r['status'] as Department['status']) ?? 'active',
    createdAt: String(r['created_at'] ?? ''),
  };
  if (r['branch_id'])  d.branchId  = String(r['branch_id']);
  if (r['parent_id'])  d.parentId  = String(r['parent_id']);
  if (r['head_id'])    d.headId    = String(r['head_id']);
  if (r['budget'])     d.budget    = Number(r['budget']);
  if (r['currency'])   d.currency  = String(r['currency']);
  return d;
}

function mapRole(r: Record<string, unknown>): EnterpriseRole {
  return {
    id:          String(r['id'] ?? ''),
    orgId:       String(r['org_id'] ?? ''),
    name:        String(r['name'] ?? ''),
    description: String(r['description'] ?? ''),
    isSystem:    Boolean(r['is_system'] ?? false),
    permissions: (r['permissions'] as Record<string, string[]>) ?? {},
    createdAt:   String(r['created_at'] ?? ''),
  };
}

function mapEmployee(r: Record<string, unknown>): Employee {
  const e: Employee = {
    id: String(r['id'] ?? ''), orgId: String(r['org_id'] ?? ''), userId: String(r['user_id'] ?? ''),
    employeeId: String(r['employee_id'] ?? ''), type: (r['type'] as Employee['type']) ?? 'full_time',
    roleId: String(r['role_id'] ?? ''), title: String(r['title'] ?? ''),
    startDate: String(r['start_date'] ?? ''), currency: String(r['currency'] ?? 'HTG'),
    status: (r['status'] as Employee['status']) ?? 'active', createdAt: String(r['created_at'] ?? ''),
  };
  if (r['branch_id'])     e.branchId     = String(r['branch_id']);
  if (r['department_id']) e.departmentId = String(r['department_id']);
  if (r['manager_id'])    e.managerId    = String(r['manager_id']);
  if (r['end_date'])      e.endDate      = String(r['end_date']);
  if (r['salary'])        e.salary       = Number(r['salary']);
  if (r['hourly_rate'])   e.hourlyRate   = Number(r['hourly_rate']);
  return e;
}

function mapPayroll(r: Record<string, unknown>): PayrollRecord {
  const p: PayrollRecord = {
    id: String(r['id'] ?? ''), orgId: String(r['org_id'] ?? ''),
    employeeId: String(r['employee_id'] ?? ''), period: String(r['period'] ?? ''),
    grossAmount: Number(r['gross_amount'] ?? 0), netAmount: Number(r['net_amount'] ?? 0),
    currency: String(r['currency'] ?? 'HTG'), items: (r['items'] as PayrollRecord['items']) ?? [],
    status: (r['status'] as PayrollRecord['status']) ?? 'draft', createdAt: String(r['created_at'] ?? ''),
  };
  if (r['approved_by']) p.approvedBy = String(r['approved_by']);
  if (r['approved_at']) p.approvedAt = String(r['approved_at']);
  if (r['paid_at'])     p.paidAt     = String(r['paid_at']);
  return p;
}

function mapInvoice(r: Record<string, unknown>): Invoice {
  const inv: Invoice = {
    id: String(r['id'] ?? ''), orgId: String(r['org_id'] ?? ''),
    type: (r['type'] as Invoice['type']) ?? 'invoice', number: String(r['number'] ?? ''),
    clientName: String(r['client_name'] ?? ''), items: (r['items'] as Invoice['items']) ?? [],
    subtotal: Number(r['subtotal'] ?? 0), taxAmount: Number(r['tax_amount'] ?? 0),
    taxRate: Number(r['tax_rate'] ?? 0), total: Number(r['total'] ?? 0),
    currency: String(r['currency'] ?? 'HTG'), status: (r['status'] as Invoice['status']) ?? 'draft',
    isRecurring: Boolean(r['is_recurring'] ?? false), createdBy: String(r['created_by'] ?? ''),
    createdAt: String(r['created_at'] ?? ''),
  };
  if (r['branch_id'])          inv.branchId          = String(r['branch_id']);
  if (r['client_email'])       inv.clientEmail       = String(r['client_email']);
  if (r['due_date'])           inv.dueDate           = String(r['due_date']);
  if (r['paid_at'])            inv.paidAt            = String(r['paid_at']);
  if (r['notes'])              inv.notes             = String(r['notes']);
  if (r['recurring_interval']) inv.recurringInterval = r['recurring_interval'] as Invoice['recurringInterval'];
  return inv;
}

function mapWorkflow(r: Record<string, unknown>): Workflow {
  return {
    id: String(r['id'] ?? ''), orgId: String(r['org_id'] ?? ''), name: String(r['name'] ?? ''),
    type: (r['type'] as Workflow['type']) ?? 'general', steps: (r['steps'] as Workflow['steps']) ?? [],
    isActive: Boolean(r['is_active'] ?? true), createdAt: String(r['created_at'] ?? ''),
  };
}

function mapWFInstance(r: Record<string, unknown>): WorkflowInstance {
  const inst: WorkflowInstance = {
    id: String(r['id'] ?? ''), workflowId: String(r['workflow_id'] ?? ''),
    orgId: String(r['org_id'] ?? ''), entityType: String(r['entity_type'] ?? ''),
    entityId: String(r['entity_id'] ?? ''), currentStep: Number(r['current_step'] ?? 0),
    status: (r['status'] as WorkflowInstance['status']) ?? 'pending',
    submittedBy: String(r['submitted_by'] ?? ''),
    steps: (r['steps'] as WorkflowInstance['steps']) ?? [], createdAt: String(r['created_at'] ?? ''),
  };
  if (r['completed_at']) inst.completedAt = String(r['completed_at']);
  return inst;
}

function mapDocument(r: Record<string, unknown>): EnterpriseDocument {
  const doc: EnterpriseDocument = {
    id: String(r['id'] ?? ''), orgId: String(r['org_id'] ?? ''),
    category: (r['category'] as EnterpriseDocument['category']) ?? 'contract',
    name: String(r['name'] ?? ''), fileUrl: String(r['file_url'] ?? ''),
    fileSize: Number(r['file_size'] ?? 0), mimeType: String(r['mime_type'] ?? ''),
    version: Number(r['version'] ?? 1), tags: (r['tags'] as string[]) ?? [],
    isConfidential: Boolean(r['is_confidential'] ?? false),
    uploadedBy: String(r['uploaded_by'] ?? ''), createdAt: String(r['created_at'] ?? ''),
  };
  if (r['branch_id'])     doc.branchId     = String(r['branch_id']);
  if (r['department_id']) doc.departmentId = String(r['department_id']);
  if (r['employee_id'])   doc.employeeId   = String(r['employee_id']);
  if (r['expires_at'])    doc.expiresAt    = String(r['expires_at']);
  return doc;
}