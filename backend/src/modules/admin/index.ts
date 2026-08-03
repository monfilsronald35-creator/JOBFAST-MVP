/**
 * Admin & Governance Platform Module (Backend)
 * Owns: User management (suspend/ban/activate/role), Moderation queue,
 *       Feature Flag Platform (per-country/city/role/userGroup + kill switch),
 *       Remote Configuration, System config, Audit log, Platform stats
 * Tables: moderation_queue, feature_flags, system_config, adm_audit_log
 * Prefix: adm_
 * Migration: 029_admin_platform.sql (run manually in Supabase SQL Editor)
 *
 * Public (no auth required):
 *   GET /api/flags          — feature flag evaluation for current user context
 *   GET /api/config/public  — remote configuration (non-secret keys only)
 *
 * Admin routes: /api/admin/* — require role: admin or superadmin
 */
import type { Express, Request, Response } from 'express';
import { adminRouter }       from './routes/admin.routes.js';
import { FeatureFlagService } from './services/FeatureFlagService.js';
import { db }                from '../../core/database/SupabaseClient.js';

export function registerAdminModule(app: Express): void {
  // ── Admin routes (require auth + admin role) ──────────────────────────────
  app.use('/api/admin', adminRouter);

  // ── Public: Feature Flag Platform ─────────────────────────────────────────
  // GET /api/flags?country=HT&city=Port-au-Prince&role=worker&userId=...
  // Returns a map of flagKey → boolean for the given user context.
  // No auth required — only enabled flag names are exposed, no sensitive data.
  app.get('/api/flags', async (req: Request, res: Response) => {
    const flags = await FeatureFlagService.evaluateAll({
      userId:     req.query['userId']  ? String(req.query['userId'])  : undefined,
      country:    req.query['country'] ? String(req.query['country']) : undefined,
      city:       req.query['city']    ? String(req.query['city'])    : undefined,
      role:       req.query['role']    ? String(req.query['role'])    : undefined,
      userGroups: req.query['groups']  ? String(req.query['groups']).split(',') : undefined,
    });
    res.json({ success: true, data: flags });
  });

  // ── Public: Remote Configuration ─────────────────────────────────────────
  // GET /api/config/public
  // Returns non-secret system_config entries (keys prefixed with 'public_').
  // Clients can poll this to receive remote config without app updates.
  app.get('/api/config/public', async (_req: Request, res: Response) => {
    const { data } = await db.client()
      .from('system_config')
      .select('key, value')
      .like('key', 'public_%')
      .eq('is_secret', false);

    const config: Record<string, string> = {};
    for (const row of (data ?? []) as { key: string; value: string }[]) {
      config[row.key] = row.value;
    }

    // Always include branding constants
    config['public_app_name']       = 'JOBFAST';
    config['public_support_email']  = 'support@jobfasthq.com';
    config['public_api_url']        = 'https://api.jobfasthq.com';
    config['public_app_url']        = 'https://jobfasthq.com';

    res.json({ success: true, data: config });
  });
}

export { FeatureFlagService } from './services/FeatureFlagService.js';