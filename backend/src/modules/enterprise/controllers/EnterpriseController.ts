import type { Request, Response, NextFunction } from 'express';
import { OrganizationService }   from '../services/OrganizationService.js';
import { BranchService }         from '../services/BranchService.js';
import { DepartmentService }     from '../services/DepartmentService.js';
import { EmployeeService }       from '../services/EmployeeService.js';
import { RolePermissionService } from '../services/RolePermissionService.js';
import { PayrollService }        from '../services/PayrollService.js';
import { InvoiceService }        from '../services/InvoiceService.js';
import { WorkflowService }       from '../services/WorkflowService.js';
import { DocumentCenterService } from '../services/DocumentCenterService.js';
import { AuditLogService }       from '../services/AuditLogService.js';
import { ReportService }         from '../services/ReportService.js';
import { SecurityService }       from '../services/SecurityService.js';
import { EnterpriseAIService }   from '../services/EnterpriseAIService.js';
import type { DocCategory, InvoiceItem, PayrollItem, WorkflowType } from '../types/enterprise.types.js';

function body(req: Request): Record<string, unknown> { return req.body as Record<string, unknown>; }
function q(req: Request):    Record<string, unknown> { return req.query as Record<string, unknown>; }
function uid(req: Request):  string                  { return req.user!.sub; }
function pid(req: Request, key: string): string      { return String(req.params[key] ?? ''); }

export const EnterpriseController = {
  // ── Organizations ────────────────────────────────────────────────────────────
  async createOrg(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = body(req);
      const org = await OrganizationService.create(uid(req), {
        name:        String(b['name'] ?? ''),
        type:        (b['type'] as 'company') ?? 'company',
        country:     String(b['country'] ?? 'HT'),
        currency:    b['currency'] ? String(b['currency']) : undefined,
        timezone:    b['timezone'] ? String(b['timezone']) : undefined,
        language:    b['language'] ? String(b['language']) : undefined,
        legalName:   b['legalName']   ? String(b['legalName'])   : undefined,
        parentOrgId: b['parentOrgId'] ? String(b['parentOrgId']) : undefined,
      });
      res.status(201).json({ data: org });
    } catch (err) { next(err); }
  },

  async listOrgs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await OrganizationService.listMine(uid(req)) }); } catch (err) { next(err); }
  },

  async getOrg(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await OrganizationService.get(pid(req, 'orgId'));
      if (!org) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
      res.json({ data: org });
    } catch (err) { next(err); }
  },

  async getHierarchy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await OrganizationService.getHierarchy(pid(req, 'orgId')) }); } catch (err) { next(err); }
  },

  async updateOrg(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await OrganizationService.update(pid(req, 'orgId'), uid(req), body(req) as never);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── Branches ─────────────────────────────────────────────────────────────────
  async createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = body(req); const orgId = pid(req, 'orgId');
      const branch = await BranchService.create(orgId, uid(req), {
        name:      String(b['name']    ?? ''),
        code:      String(b['code']    ?? ''),
        country:   String(b['country'] ?? 'HT'),
        city:      String(b['city']    ?? ''),
        timezone:  b['timezone']  ? String(b['timezone'])  : undefined,
        language:  b['language']  ? String(b['language'])  : undefined,
        currency:  b['currency']  ? String(b['currency'])  : undefined,
        managerId: b['managerId'] ? String(b['managerId']) : undefined,
        phone:     b['phone']     ? String(b['phone'])     : undefined,
        email:     b['email']     ? String(b['email'])     : undefined,
        address:   b['address']   ? String(b['address'])   : undefined,
      });
      res.status(201).json({ data: branch });
    } catch (err) { next(err); }
  },

  async listBranches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await BranchService.list(pid(req, 'orgId')) }); } catch (err) { next(err); }
  },

  async getBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branch = await BranchService.get(pid(req, 'branchId'));
      if (!branch) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
      res.json({ data: branch });
    } catch (err) { next(err); }
  },

  async updateBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await BranchService.update(pid(req, 'branchId'), pid(req, 'orgId'), uid(req), body(req) as never);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── Departments ───────────────────────────────────────────────────────────────
  async createDept(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = body(req); const orgId = pid(req, 'orgId');
      const dept = await DepartmentService.create(orgId, uid(req), {
        name:      String(b['name'] ?? ''), code: String(b['code'] ?? ''),
        branchId:  b['branchId']  ? String(b['branchId'])  : undefined,
        parentId:  b['parentId']  ? String(b['parentId'])  : undefined,
        headId:    b['headId']    ? String(b['headId'])    : undefined,
        budget:    b['budget']    ? Number(b['budget'])    : undefined,
        currency:  b['currency']  ? String(b['currency'])  : undefined,
      });
      res.status(201).json({ data: dept });
    } catch (err) { next(err); }
  },

  async listDepts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qp = q(req);
      res.json({ data: await DepartmentService.list(pid(req, 'orgId'), qp['branchId'] ? String(qp['branchId']) : undefined) });
    } catch (err) { next(err); }
  },

  async getDeptTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await DepartmentService.tree(pid(req, 'orgId')) }); } catch (err) { next(err); }
  },

  // ── Roles ─────────────────────────────────────────────────────────────────────
  async listRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await RolePermissionService.list(pid(req, 'orgId')) }); } catch (err) { next(err); }
  },

  async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = body(req);
      const role = await RolePermissionService.create(pid(req, 'orgId'), uid(req), {
        name:        String(b['name'] ?? ''),
        description: String(b['description'] ?? ''),
        permissions: (b['permissions'] as Record<string, string[]>) ?? {},
      });
      res.status(201).json({ data: role });
    } catch (err) { next(err); }
  },

  async updateRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = body(req);
      await RolePermissionService.updatePermissions(pid(req, 'roleId'), pid(req, 'orgId'), uid(req),
        (b['permissions'] as Record<string, string[]>) ?? {});
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── Employees ─────────────────────────────────────────────────────────────────
  async onboardEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = body(req);
      const emp = await EmployeeService.onboard(pid(req, 'orgId'), uid(req), {
        userId:       String(b['userId'] ?? ''),
        type:         (b['type'] as 'full_time') ?? 'full_time',
        roleId:       String(b['roleId'] ?? ''),
        title:        String(b['title'] ?? ''),
        branchId:     b['branchId']     ? String(b['branchId'])     : undefined,
        departmentId: b['departmentId'] ? String(b['departmentId']) : undefined,
        managerId:    b['managerId']    ? String(b['managerId'])     : undefined,
        salary:       b['salary']       ? Number(b['salary'])       : undefined,
        hourlyRate:   b['hourlyRate']   ? Number(b['hourlyRate'])   : undefined,
        currency:     b['currency']     ? String(b['currency'])     : undefined,
        startDate:    b['startDate']    ? String(b['startDate'])    : undefined,
      });
      res.status(201).json({ data: emp });
    } catch (err) { next(err); }
  },

  async listEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qp = q(req);
      res.json({ data: await EmployeeService.list(pid(req, 'orgId'), {
        branchId: qp['branchId'] ? String(qp['branchId']) : undefined,
        deptId:   qp['deptId']   ? String(qp['deptId'])   : undefined,
        status:   qp['status']   ? String(qp['status'])   : undefined,
      }) });
    } catch (err) { next(err); }
  },

  async getEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const emp = await EmployeeService.get(pid(req, 'empId'));
      if (!emp) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
      res.json({ data: emp });
    } catch (err) { next(err); }
  },

  async updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await EmployeeService.update(pid(req, 'empId'), pid(req, 'orgId'), uid(req), body(req) as never);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async terminateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = body(req);
      await EmployeeService.terminate(pid(req, 'empId'), pid(req, 'orgId'), uid(req), String(b['endDate'] ?? new Date().toISOString().slice(0, 10)));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── Payroll ───────────────────────────────────────────────────────────────────
  async generatePayroll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = body(req);
      const record = await PayrollService.generate(pid(req, 'orgId'), uid(req), {
        employeeId: String(b['employeeId'] ?? ''),
        period:     String(b['period'] ?? ''),
        items:      (b['items'] as PayrollItem[]) ?? [],
        currency:   String(b['currency'] ?? 'HTG'),
      });
      res.status(201).json({ data: record });
    } catch (err) { next(err); }
  },

  async listPayroll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qp = q(req);
      res.json({ data: await PayrollService.list(pid(req, 'orgId'), qp['period'] ? String(qp['period']) : undefined) });
    } catch (err) { next(err); }
  },

  async approvePayroll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await PayrollService.approve(pid(req, 'payrollId'), pid(req, 'orgId'), uid(req));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async markPayrollPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await PayrollService.markPaid(pid(req, 'payrollId'), pid(req, 'orgId'), uid(req));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── Invoices ──────────────────────────────────────────────────────────────────
  async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = body(req);
      const inv = await InvoiceService.create(pid(req, 'orgId'), uid(req), {
        type:              (b['type'] as 'invoice') ?? 'invoice',
        clientName:        String(b['clientName'] ?? ''),
        clientEmail:       b['clientEmail'] ? String(b['clientEmail']) : undefined,
        items:             (b['items'] as InvoiceItem[]) ?? [],
        taxRate:           b['taxRate'] ? Number(b['taxRate']) : undefined,
        currency:          b['currency'] ? String(b['currency']) : undefined,
        dueDate:           b['dueDate']  ? String(b['dueDate'])  : undefined,
        notes:             b['notes']    ? String(b['notes'])    : undefined,
        branchId:          b['branchId'] ? String(b['branchId']) : undefined,
        isRecurring:       Boolean(b['isRecurring'] ?? false),
        recurringInterval: b['recurringInterval'] as never,
      });
      res.status(201).json({ data: inv });
    } catch (err) { next(err); }
  },

  async listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qp = q(req);
      res.json({ data: await InvoiceService.list(pid(req, 'orgId'), {
        type:   qp['type']   ? String(qp['type'])   : undefined,
        status: qp['status'] ? String(qp['status']) : undefined,
      }) });
    } catch (err) { next(err); }
  },

  async getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const inv = await InvoiceService.get(pid(req, 'invId'));
      if (!inv) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
      res.json({ data: inv });
    } catch (err) { next(err); }
  },

  async sendInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await InvoiceService.send(pid(req, 'invId'), pid(req, 'orgId'), uid(req));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async markInvoicePaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await InvoiceService.markPaid(pid(req, 'invId'), pid(req, 'orgId'), uid(req));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── Workflows ─────────────────────────────────────────────────────────────────
  async createWorkflow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = body(req);
      const wf = await WorkflowService.create(pid(req, 'orgId'), uid(req), {
        name:  String(b['name'] ?? ''),
        type:  (b['type'] as WorkflowType) ?? 'general',
        steps: (b['steps'] as never) ?? [],
      });
      res.status(201).json({ data: wf });
    } catch (err) { next(err); }
  },

  async listWorkflows(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await WorkflowService.listWorkflows(pid(req, 'orgId')) }); } catch (err) { next(err); }
  },

  async submitWorkflow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = body(req);
      const inst = await WorkflowService.submit(pid(req, 'orgId'), uid(req), {
        workflowId: String(b['workflowId'] ?? ''),
        entityType: String(b['entityType'] ?? ''),
        entityId:   String(b['entityId'] ?? ''),
      });
      res.status(201).json({ data: inst });
    } catch (err) { next(err); }
  },

  async decideWorkflow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = body(req);
      const inst = await WorkflowService.decide(
        pid(req, 'instanceId'), pid(req, 'orgId'), uid(req),
        (b['decision'] as 'approved' | 'rejected') ?? 'approved',
        b['comment'] ? String(b['comment']) : undefined,
      );
      res.json({ data: inst });
    } catch (err) { next(err); }
  },

  async listWorkflowInstances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qp = q(req);
      res.json({ data: await WorkflowService.listWorkflowInstances(pid(req, 'orgId'), qp['status'] ? String(qp['status']) : undefined) });
    } catch (err) { next(err); }
  },

  // ── Documents ─────────────────────────────────────────────────────────────────
  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = body(req);
      const doc = await DocumentCenterService.upload(pid(req, 'orgId'), uid(req), {
        name:           String(b['name'] ?? ''),
        fileUrl:        String(b['fileUrl'] ?? ''),
        fileSize:       Number(b['fileSize'] ?? 0),
        mimeType:       String(b['mimeType'] ?? 'application/octet-stream'),
        category:       (b['category'] as DocCategory) ?? 'contract',
        tags:           (b['tags'] as string[]) ?? [],
        isConfidential: Boolean(b['isConfidential'] ?? false),
        branchId:       b['branchId']     ? String(b['branchId'])     : undefined,
        departmentId:   b['departmentId'] ? String(b['departmentId']) : undefined,
        employeeId:     b['employeeId']   ? String(b['employeeId'])   : undefined,
        expiresAt:      b['expiresAt']    ? String(b['expiresAt'])    : undefined,
      });
      res.status(201).json({ data: doc });
    } catch (err) { next(err); }
  },

  async listDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qp = q(req);
      res.json({ data: await DocumentCenterService.list(pid(req, 'orgId'), {
        category:   qp['category']   ? String(qp['category'])   : undefined,
        employeeId: qp['employeeId'] ? String(qp['employeeId']) : undefined,
      }) });
    } catch (err) { next(err); }
  },

  async getExpiringDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qp = q(req);
      const days = qp['days'] ? Number(qp['days']) : 30;
      res.json({ data: await DocumentCenterService.getExpiring(pid(req, 'orgId'), days) });
    } catch (err) { next(err); }
  },

  // ── Audit ─────────────────────────────────────────────────────────────────────
  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qp     = q(req);
      const limit  = Number(qp['limit']  ?? 100);
      const offset = Number(qp['offset'] ?? 0);
      res.json({ data: await AuditLogService.list(pid(req, 'orgId'), limit, offset) });
    } catch (err) { next(err); }
  },

  // ── Reports ───────────────────────────────────────────────────────────────────
  async getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qp     = q(req);
      const period = qp['period'] ? String(qp['period']) : new Date().toISOString().slice(0, 7);
      res.json({ data: await ReportService.generate(pid(req, 'orgId'), period) });
    } catch (err) { next(err); }
  },

  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ data: await ReportService.getDashboard(pid(req, 'orgId'), uid(req)) });
    } catch (err) { next(err); }
  },

  // ── Security ──────────────────────────────────────────────────────────────────
  async getSecuritySettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await SecurityService.getSettings(pid(req, 'orgId')) }); } catch (err) { next(err); }
  },

  async updateSecuritySettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await SecurityService.updateSettings(pid(req, 'orgId'), uid(req), body(req) as never);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async listDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await SecurityService.listDevices(uid(req), pid(req, 'orgId')) }); } catch (err) { next(err); }
  },

  async revokeDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await SecurityService.revokeDevice(pid(req, 'deviceId'), uid(req), pid(req, 'orgId'));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── AI Assistant ──────────────────────────────────────────────────────────────
  async aiQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = body(req);
      const response = await EnterpriseAIService.query({
        question: String(b['question'] ?? ''),
        orgId:    pid(req, 'orgId'),
        lang:     b['lang'] ? String(b['lang']) : undefined,
      });
      res.json({ data: response });
    } catch (err) { next(err); }
  },
};