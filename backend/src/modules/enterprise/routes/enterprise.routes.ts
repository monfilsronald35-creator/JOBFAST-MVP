import { Router }                from 'express';
import { requireAuth }           from '../../../core/middleware/auth.middleware.js';
import { EnterpriseController }  from '../controllers/EnterpriseController.js';

export const enterpriseRouter = Router();
const R = requireAuth;
const C = EnterpriseController;

// ── Organizations ────────────────────────────────────────────────────────────
enterpriseRouter.get   ('/',                           R, C.listOrgs);
enterpriseRouter.post  ('/',                           R, C.createOrg);
enterpriseRouter.get   ('/:orgId',                     R, C.getOrg);
enterpriseRouter.patch ('/:orgId',                     R, C.updateOrg);
enterpriseRouter.get   ('/:orgId/hierarchy',           R, C.getHierarchy);

// ── Dashboard & Reports ──────────────────────────────────────────────────────
enterpriseRouter.get   ('/:orgId/dashboard',           R, C.getDashboard);
enterpriseRouter.get   ('/:orgId/reports',             R, C.getReport);

// ── Branches ─────────────────────────────────────────────────────────────────
enterpriseRouter.get   ('/:orgId/branches',            R, C.listBranches);
enterpriseRouter.post  ('/:orgId/branches',            R, C.createBranch);
enterpriseRouter.get   ('/:orgId/branches/:branchId',  R, C.getBranch);
enterpriseRouter.patch ('/:orgId/branches/:branchId',  R, C.updateBranch);

// ── Departments ───────────────────────────────────────────────────────────────
enterpriseRouter.get   ('/:orgId/departments',         R, C.listDepts);
enterpriseRouter.post  ('/:orgId/departments',         R, C.createDept);
enterpriseRouter.get   ('/:orgId/departments/tree',    R, C.getDeptTree);

// ── Roles & Permissions ───────────────────────────────────────────────────────
enterpriseRouter.get   ('/:orgId/roles',               R, C.listRoles);
enterpriseRouter.post  ('/:orgId/roles',               R, C.createRole);
enterpriseRouter.patch ('/:orgId/roles/:roleId/permissions', R, C.updateRolePermissions);

// ── Employees ─────────────────────────────────────────────────────────────────
enterpriseRouter.get   ('/:orgId/employees',           R, C.listEmployees);
enterpriseRouter.post  ('/:orgId/employees',           R, C.onboardEmployee);
enterpriseRouter.get   ('/:orgId/employees/:empId',    R, C.getEmployee);
enterpriseRouter.patch ('/:orgId/employees/:empId',    R, C.updateEmployee);
enterpriseRouter.post  ('/:orgId/employees/:empId/terminate', R, C.terminateEmployee);

// ── Payroll ───────────────────────────────────────────────────────────────────
enterpriseRouter.get   ('/:orgId/payroll',             R, C.listPayroll);
enterpriseRouter.post  ('/:orgId/payroll',             R, C.generatePayroll);
enterpriseRouter.post  ('/:orgId/payroll/:payrollId/approve', R, C.approvePayroll);
enterpriseRouter.post  ('/:orgId/payroll/:payrollId/paid',    R, C.markPayrollPaid);

// ── Invoices ──────────────────────────────────────────────────────────────────
enterpriseRouter.get   ('/:orgId/invoices',            R, C.listInvoices);
enterpriseRouter.post  ('/:orgId/invoices',            R, C.createInvoice);
enterpriseRouter.get   ('/:orgId/invoices/:invId',     R, C.getInvoice);
enterpriseRouter.post  ('/:orgId/invoices/:invId/send',     R, C.sendInvoice);
enterpriseRouter.post  ('/:orgId/invoices/:invId/paid',     R, C.markInvoicePaid);

// ── Workflows ─────────────────────────────────────────────────────────────────
enterpriseRouter.get   ('/:orgId/workflows',           R, C.listWorkflows);
enterpriseRouter.post  ('/:orgId/workflows',           R, C.createWorkflow);
enterpriseRouter.get   ('/:orgId/workflows/instances', R, C.listWorkflowInstances);
enterpriseRouter.post  ('/:orgId/workflows/submit',    R, C.submitWorkflow);
enterpriseRouter.post  ('/:orgId/workflows/instances/:instanceId/decide', R, C.decideWorkflow);

// ── Documents ─────────────────────────────────────────────────────────────────
enterpriseRouter.get   ('/:orgId/documents',           R, C.listDocuments);
enterpriseRouter.post  ('/:orgId/documents',           R, C.uploadDocument);
enterpriseRouter.get   ('/:orgId/documents/expiring',  R, C.getExpiringDocuments);

// ── Audit ─────────────────────────────────────────────────────────────────────
enterpriseRouter.get   ('/:orgId/audit',               R, C.getAuditLogs);

// ── Security ──────────────────────────────────────────────────────────────────
enterpriseRouter.get   ('/:orgId/security',            R, C.getSecuritySettings);
enterpriseRouter.patch ('/:orgId/security',            R, C.updateSecuritySettings);
enterpriseRouter.get   ('/:orgId/security/devices',    R, C.listDevices);
enterpriseRouter.delete('/:orgId/security/devices/:deviceId', R, C.revokeDevice);

// ── AI Assistant ──────────────────────────────────────────────────────────────
enterpriseRouter.post  ('/:orgId/ai/query',            R, C.aiQuery);