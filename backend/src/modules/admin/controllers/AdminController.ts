import type { Request, Response } from 'express';
import { AdminService } from '../services/AdminService.js';

function actorId(req: Request): string {
  return (req as unknown as { user?: { sub?: string } }).user?.sub ?? '';
}

export const AdminController = {
  // ── Stats ────────────────────────────────────────────────────────────────────
  async getStats(_req: Request, res: Response): Promise<void> {
    const stats = await AdminService.getPlatformStats();
    res.json({ success: true, data: stats });
  },

  // ── User management ──────────────────────────────────────────────────────────
  async listUsers(req: Request, res: Response): Promise<void> {
    const page   = parseInt(String(req.query['page']   ?? '1'),  10);
    const limit  = parseInt(String(req.query['limit']  ?? '20'), 10);
    const search = req.query['search'] ? String(req.query['search']) : undefined;
    const status = req.query['status'] ? String(req.query['status']) : undefined;
    const users  = await AdminService.listUsers(page, limit, search, status);
    res.json({ success: true, data: users, page, limit });
  },

  async suspendUser(req: Request, res: Response): Promise<void> {
    const userId = String(req.params['userId'] ?? '');
    const { reason } = req.body as { reason?: string };
    if (!reason) { res.status(400).json({ error: 'reason obligatwa' }); return; }
    await AdminService.suspendUser(actorId(req), userId, reason);
    res.json({ success: true, message: 'Itilizatè a sispan.' });
  },

  async activateUser(req: Request, res: Response): Promise<void> {
    const userId = String(req.params['userId'] ?? '');
    await AdminService.activateUser(actorId(req), userId);
    res.json({ success: true, message: 'Itilizatè a aktive.' });
  },

  async banUser(req: Request, res: Response): Promise<void> {
    const userId = String(req.params['userId'] ?? '');
    const { reason } = req.body as { reason?: string };
    if (!reason) { res.status(400).json({ error: 'reason obligatwa' }); return; }
    await AdminService.banUser(actorId(req), userId, reason);
    res.json({ success: true, message: 'Itilizatè a bani.' });
  },

  async changeRole(req: Request, res: Response): Promise<void> {
    const userId  = String(req.params['userId'] ?? '');
    const { role } = req.body as { role?: string };
    if (!role) { res.status(400).json({ error: 'role obligatwa' }); return; }
    await AdminService.changeUserRole(actorId(req), userId, role);
    res.json({ success: true, message: `Wòl chanje pou ${role}.` });
  },

  // ── Moderation ──────────────────────────────────────────────────────────────
  async getModerationQueue(req: Request, res: Response): Promise<void> {
    const status = String(req.query['status'] ?? 'pending') as 'pending' | 'approved' | 'rejected' | 'escalated';
    const items  = await AdminService.getModerationQueue(status);
    res.json({ success: true, data: items });
  },

  async resolveModeration(req: Request, res: Response): Promise<void> {
    const itemId = String(req.params['id'] ?? '');
    const { action, resolution } = req.body as { action?: 'approve' | 'reject'; resolution?: string };
    if (action !== 'approve' && action !== 'reject') {
      res.status(400).json({ error: 'action dwe "approve" oswa "reject"' }); return;
    }
    await AdminService.resolveModeration(actorId(req), itemId, action, resolution);
    res.status(204).end();
  },

  // ── Feature flags ────────────────────────────────────────────────────────────
  async getFlags(_req: Request, res: Response): Promise<void> {
    const flags = await AdminService.getFeatureFlags();
    res.json({ success: true, data: flags });
  },

  async setFlag(req: Request, res: Response): Promise<void> {
    const key        = String(req.params['key'] ?? '');
    const { enabled, rolloutPct } = req.body as { enabled?: boolean; rolloutPct?: number };
    if (enabled === undefined) { res.status(400).json({ error: 'enabled obligatwa' }); return; }
    await AdminService.setFeatureFlag(actorId(req), key, Boolean(enabled), rolloutPct);
    res.json({ success: true });
  },

  // ── System config ────────────────────────────────────────────────────────────
  async getConfig(_req: Request, res: Response): Promise<void> {
    const config = await AdminService.getSystemConfig();
    res.json({ success: true, data: config });
  },

  async setConfig(req: Request, res: Response): Promise<void> {
    const key   = String(req.params['key'] ?? '');
    const { value, description } = req.body as { value?: string; description?: string };
    if (!value) { res.status(400).json({ error: 'value obligatwa' }); return; }
    await AdminService.setSystemConfig(actorId(req), key, value, description);
    res.json({ success: true });
  },

  // ── Audit log ────────────────────────────────────────────────────────────────
  async getAuditLog(req: Request, res: Response): Promise<void> {
    const page    = parseInt(String(req.query['page']    ?? '1'),  10);
    const limit   = parseInt(String(req.query['limit']   ?? '50'), 10);
    const actor   = req.query['actorId'] ? String(req.query['actorId']) : undefined;
    const action  = req.query['action']  ? String(req.query['action'])  : undefined;
    const logs    = await AdminService.getAuditLog(page, limit, actor, action);
    res.json({ success: true, data: logs, page, limit });
  },

  // ── Health ────────────────────────────────────────────────────────────────────
  async health(_req: Request, res: Response): Promise<void> {
    res.json({ success: true, data: { status: 'ok', timestamp: Date.now(), version: process.env['npm_package_version'] ?? '1.0.0' } });
  },
};