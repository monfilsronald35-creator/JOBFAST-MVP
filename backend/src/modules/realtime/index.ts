/**
 * Realtime Platform Module
 * REST endpoints: presence query, sync status.
 * Socket.io gateway (RealtimeGateway) is wired in server.ts alongside ChatGateway.
 *
 * Tables: rt_sync_queue, rt_sync_checkpoints, rt_presence_log
 * Migration: 033_realtime_platform.sql (run manually in Supabase SQL Editor)
 */
import type { Express } from 'express';
import { requireAuth }  from '../../core/middleware/auth.middleware.js';
import { db }           from '../../core/database/SupabaseClient.js';

export function registerRealtimeModule(app: Express): void {
  // ── Presence query ─────────────────────────────────────────────────────────
  app.get('/api/realtime/presence/:userId', requireAuth, async (req, res) => {
    const userId = String(req.params['userId'] ?? '');
    const { data } = await db.client()
      .from('rt_presence_log')
      .select('status, changed_at')
      .eq('user_id', userId)
      .maybeSingle();
    res.json({ success: true, data: data ?? { status: 'offline', changed_at: null } });
  });

  // ── Sync queue status ──────────────────────────────────────────────────────
  app.get('/api/realtime/sync/status', requireAuth, async (req, res) => {
    const userId   = (req as unknown as { user?: { sub?: string } }).user?.sub ?? '';
    const deviceId = String(req.query['deviceId'] ?? '');
    const { data: checkpoint } = await db.client()
      .from('rt_sync_checkpoints')
      .select('last_sync_at')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .maybeSingle();
    const { count: pendingCount } = await db.client()
      .from('rt_sync_queue')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending');
    res.json({
      success: true,
      data: { lastSyncAt: checkpoint?.last_sync_at ?? null, pendingOps: pendingCount ?? 0 },
    });
  });

  // ── Flush applied ops from sync queue ─────────────────────────────────────
  app.delete('/api/realtime/sync/queue', requireAuth, async (req, res) => {
    const userId   = (req as unknown as { user?: { sub?: string } }).user?.sub ?? '';
    const deviceId = String(req.query['deviceId'] ?? '');
    await db.client()
      .from('rt_sync_queue')
      .delete()
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .eq('status', 'applied');
    res.json({ success: true });
  });
}

export { RealtimeGateway } from './gateway/RealtimeGateway.js';