/**
 * Enterprise Module (Backend)
 * Owns: Organization Management, Multi-Branch, Departments, Employee Lifecycle,
 *       Roles & Permissions, Payroll, Invoice, Approval Workflows, Document Center,
 *       Audit Logs, Enterprise Reports, AI Assistant, Security (SSO/MFA/Devices)
 * Tables: ent_organizations, ent_branches, ent_departments, ent_roles, ent_employees,
 *         ent_payroll, ent_invoices, ent_workflows, ent_workflow_instances,
 *         ent_documents, ent_audit_logs, ent_security_settings, ent_trusted_devices
 * Prefix: ent_
 * Migration: 019_enterprise_platform.sql (run manually in Supabase SQL Editor)
 */
import type { Express } from 'express';
import { enterpriseRouter } from './routes/enterprise.routes.js';

export function registerEnterpriseModule(app: Express): void {
  app.use('/api/enterprise', enterpriseRouter);
}