/**
 * Admin & Governance Platform Module (Backend)
 * Owns: User management (suspend/ban/activate/role), Moderation queue,
 *       Feature flags, System config, Audit log, Platform stats
 * Tables: moderation_queue, feature_flags, system_config, adm_audit_log
 * Prefix: adm_
 * Migration: 029_admin_platform.sql (run manually in Supabase SQL Editor)
 * All routes require role: admin or superadmin
 */
import type { Express } from 'express';
import { adminRouter } from './routes/admin.routes.js';

export function registerAdminModule(app: Express): void {
  app.use('/api/admin', adminRouter);
}