/**
 * RealtimeGateway — bridges TypedEventBus → Socket.io for live data push.
 * Called from server.ts alongside ChatGateway.init(io).
 *
 * Client → Server events:
 *   rt:auth               — join user room (userId)
 *   rt:gps:update         — send GPS position
 *   rt:gps:subscribe      — subscribe to a user's GPS track
 *   rt:gps:unsubscribe    — unsubscribe from GPS track
 *   rt:presence:status    — update own presence status
 *   rt:presence:subscribe — get snapshot of multiple users' presence
 *   rt:dashboard:subscribe — receive periodic dashboard metrics (admin)
 *   rt:analytics:subscribe — receive periodic analytics metrics (admin)
 *   rt:sync:push          — push offline operations to server
 *   rt:sync:pull          — pull changes from server since timestamp
 *
 * Server → Client events:
 *   rt:gps:position        — GPS position update
 *   rt:presence:update     — presence status change
 *   rt:presence:snapshot   — bulk presence snapshot response
 *   rt:wallet:update       — wallet/payment event
 *   rt:jobs:update         — jobs event
 *   rt:market:update       — marketplace event
 *   rt:notification:push   — new notification
 *   rt:gov:update          — government service event
 *   rt:storage:update      — storage event
 *   rt:security:incident   — security incident (admin only)
 *   rt:dashboard:update    — dashboard metrics (30s interval)
 *   rt:analytics:update    — analytics metrics (15s interval)
 *   rt:sync:ack            — offline ops acknowledged
 *   rt:sync:changes        — server-side changes to pull
 *   rt:sync:error          — sync error
 */
import type { Server, Socket } from 'socket.io';
import { TypedEventBus }       from '../../../core/events/TypedEventBus.js';
import { db }                  from '../../../core/database/SupabaseClient.js';
import type {
  ExtPresenceStatus,
  GpsRole,
  GpsUpdate,
  PresenceSnapshot,
  SyncOperation,
} from '../types/realtime.types.js';

// In-memory presence (userId → PresenceSnapshot)
const _presence = new Map<string, PresenceSnapshot>();

// Socket IDs subscribed to periodic push streams
const _dashboardSubs = new Set<string>();
const _analyticsSubs = new Set<string>();

let _io:              Server | null = null;
let _dashboardTimer:  ReturnType<typeof setInterval> | null = null;
let _analyticsTimer:  ReturnType<typeof setInterval> | null = null;

// ── Singleton helpers ────────────────────────────────────────────────────────
function _setPresence(userId: string, status: ExtPresenceStatus): void {
  const prev = _presence.get(userId);
  _presence.set(userId, {
    userId,
    status,
    lastSeen: status === 'offline' ? new Date().toISOString() : (prev?.lastSeen ?? null),
  });
}

function _broadcastPresence(io: Server, userId: string): void {
  const snap = _presence.get(userId);
  if (snap) io.emit('rt:presence:update', snap);
}

// ── TypedEventBus bridge ─────────────────────────────────────────────────────
function _bridgeEvents(io: Server): void {
  function pld(ev: { payload: unknown }): Record<string, unknown> {
    return (ev.payload as Record<string, unknown>);
  }

  // Wallet / Payments
  TypedEventBus.subscribe('wallet.balance_updated', ev => {
    const p = pld(ev);
    if (p['userId']) io.to(`rt:user:${String(p['userId'])}`).emit('rt:wallet:update', { type: 'balance', ...p });
  });
  TypedEventBus.subscribe('wallet.transaction_created', ev => {
    const p = pld(ev);
    if (p['userId']) io.to(`rt:user:${String(p['userId'])}`).emit('rt:wallet:update', { type: 'transaction', ...p });
  });
  TypedEventBus.subscribe('payment.completed', ev => {
    const p = pld(ev);
    if (p['userId'])   io.to(`rt:user:${String(p['userId'])}`).emit('rt:wallet:update', { type: 'payment_completed', ...p });
    if (p['payeeId'])  io.to(`rt:user:${String(p['payeeId'])}`).emit('rt:wallet:update', { type: 'payment_received', ...p });
  });
  TypedEventBus.subscribe('payment.refunded', ev => {
    const p = pld(ev);
    if (p['userId']) io.to(`rt:user:${String(p['userId'])}`).emit('rt:wallet:update', { type: 'refund', ...p });
  });

  // Jobs
  TypedEventBus.subscribe('job.created', ev => {
    // Broadcast new job to all connected workers (job board refresh)
    io.emit('rt:jobs:update', { type: 'new_job', ...pld(ev) });
  });
  TypedEventBus.subscribe('job.application_submitted', ev => {
    const p = pld(ev);
    if (p['employerId']) io.to(`rt:user:${String(p['employerId'])}`).emit('rt:jobs:update', { type: 'new_application', ...p });
  });
  TypedEventBus.subscribe('job.contract_created', ev => {
    const p = pld(ev);
    if (p['workerId'])   io.to(`rt:user:${String(p['workerId'])}`).emit('rt:jobs:update',   { type: 'contract_created', ...p });
    if (p['employerId']) io.to(`rt:user:${String(p['employerId'])}`).emit('rt:jobs:update', { type: 'contract_created', ...p });
  });
  TypedEventBus.subscribe('job.offer_sent', ev => {
    const p = pld(ev);
    if (p['workerId']) io.to(`rt:user:${String(p['workerId'])}`).emit('rt:jobs:update', { type: 'offer', ...p });
  });
  TypedEventBus.subscribe('job.interview_scheduled', ev => {
    const p = pld(ev);
    if (p['workerId'])   io.to(`rt:user:${String(p['workerId'])}`).emit('rt:jobs:update',   { type: 'interview', ...p });
    if (p['employerId']) io.to(`rt:user:${String(p['employerId'])}`).emit('rt:jobs:update', { type: 'interview', ...p });
  });

  // Marketplace
  TypedEventBus.subscribe('marketplace.order_placed', ev => {
    const p = pld(ev);
    if (p['sellerId']) io.to(`rt:user:${String(p['sellerId'])}`).emit('rt:market:update', { type: 'new_order', ...p });
    if (p['buyerId'])  io.to(`rt:user:${String(p['buyerId'])}`).emit('rt:market:update',  { type: 'order_confirmed', ...p });
  });
  TypedEventBus.subscribe('marketplace.order_status_changed', ev => {
    const p = pld(ev);
    if (p['buyerId'])  io.to(`rt:user:${String(p['buyerId'])}`).emit('rt:market:update',  { type: 'order_status', ...p });
    if (p['sellerId']) io.to(`rt:user:${String(p['sellerId'])}`).emit('rt:market:update', { type: 'order_status', ...p });
  });
  TypedEventBus.subscribe('marketplace.stock_updated', ev => {
    // Broadcast stock changes to all (relevant for buyers watching items)
    io.emit('rt:market:update', { type: 'stock_update', ...pld(ev) });
  });

  // Notifications
  TypedEventBus.subscribe('notification.created', ev => {
    const p = pld(ev);
    if (p['userId']) io.to(`rt:user:${String(p['userId'])}`).emit('rt:notification:push', p);
  });

  // Government
  TypedEventBus.subscribe('government.permit_status_changed', ev => {
    const p = pld(ev);
    if (p['citizenId']) io.to(`rt:user:${String(p['citizenId'])}`).emit('rt:gov:update', { type: 'permit_status', ...p });
  });
  TypedEventBus.subscribe('government.license_status_changed', ev => {
    const p = pld(ev);
    if (p['holderId']) io.to(`rt:user:${String(p['holderId'])}`).emit('rt:gov:update', { type: 'license_status', ...p });
  });
  TypedEventBus.subscribe('government.appointment_booked', ev => {
    const p = pld(ev);
    if (p['citizenId']) io.to(`rt:user:${String(p['citizenId'])}`).emit('rt:gov:update', { type: 'appointment_booked', ...p });
  });
  TypedEventBus.subscribe('government.certificate_issued', ev => {
    const p = pld(ev);
    if (p['citizenId']) io.to(`rt:user:${String(p['citizenId'])}`).emit('rt:gov:update', { type: 'certificate_issued', ...p });
  });

  // Storage
  TypedEventBus.subscribe('storage.file_uploaded', ev => {
    const p = pld(ev);
    if (p['uploaderId']) io.to(`rt:user:${String(p['uploaderId'])}`).emit('rt:storage:update', { type: 'file_ready', ...p });
  });

  // Security incidents → admin rooms
  TypedEventBus.subscribe('security.incident_created', ev => {
    const p = pld(ev);
    io.to('role:admin').emit('rt:security:incident', p);
    io.to('role:superadmin').emit('rt:security:incident', p);
  });
}

// ── Periodic push streams ────────────────────────────────────────────────────
async function _pushDashboard(io: Server): Promise<void> {
  try {
    const [{ count: users }, { count: openJobs }, { count: pendingOrders }] = await Promise.all([
      db.client().from('profiles').select('id', { count: 'exact', head: true }),
      db.client().from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      db.client().from('marketplace_orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    const payload = { users: users ?? 0, openJobs: openJobs ?? 0, pendingOrders: pendingOrders ?? 0, ts: Date.now() };
    for (const sid of _dashboardSubs) io.to(sid).emit('rt:dashboard:update', payload);
  } catch {
    // Non-fatal: dashboard push is best-effort
  }
}

async function _pushAnalytics(io: Server): Promise<void> {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    const { count: activeUsers } = await db.client()
      .from('rt_sync_checkpoints')
      .select('user_id', { count: 'exact', head: true })
      .gte('last_sync_at', fiveMinAgo);
    const payload = { activeUsers: activeUsers ?? 0, ts: Date.now() };
    for (const sid of _analyticsSubs) io.to(sid).emit('rt:analytics:update', payload);
  } catch {
    // Non-fatal
  }
}

function _startDashboardTimer(io: Server): void {
  if (_dashboardTimer) return;
  _dashboardTimer = setInterval(() => {
    if (_dashboardSubs.size === 0) { clearInterval(_dashboardTimer!); _dashboardTimer = null; return; }
    void _pushDashboard(io);
  }, 30_000);
}

function _startAnalyticsTimer(io: Server): void {
  if (_analyticsTimer) return;
  _analyticsTimer = setInterval(() => {
    if (_analyticsSubs.size === 0) { clearInterval(_analyticsTimer!); _analyticsTimer = null; return; }
    void _pushAnalytics(io);
  }, 15_000);
}

// ── Main export ──────────────────────────────────────────────────────────────
export const RealtimeGateway = {
  init(io: Server): void {
    _io = io;
    _bridgeEvents(io);

    io.on('connection', (socket: Socket) => {
      let _userId = '';

      // ── Auth ───────────────────────────────────────────────────────────────
      socket.on('rt:auth', ({ userId, role }: { userId?: string; role?: string } = {}) => {
        if (!userId) return;
        _userId = userId;
        socket.join(`rt:user:${userId}`);
        if (role) socket.join(`role:${role}`);
        _setPresence(userId, 'online');
        _broadcastPresence(io, userId);
      });

      // ── GPS ────────────────────────────────────────────────────────────────
      socket.on('rt:gps:update', (data: {
        userId?: string; lat?: number; lng?: number;
        role?: GpsRole; speed?: number; heading?: number;
      } = {}) => {
        if (!data.userId || data.lat == null || data.lng == null) return;
        const update: GpsUpdate = {
          userId:  data.userId,
          lat:     data.lat,
          lng:     data.lng,
          role:    data.role ?? 'worker',
          ts:      Date.now(),
        };
        if (data.speed   != null) update.speed   = data.speed;
        if (data.heading != null) update.heading = data.heading;
        io.to(`gps:${data.userId}`).emit('rt:gps:position', update);
      });

      socket.on('rt:gps:subscribe', ({ targetUserId }: { targetUserId?: string } = {}) => {
        if (targetUserId) socket.join(`gps:${targetUserId}`);
      });

      socket.on('rt:gps:unsubscribe', ({ targetUserId }: { targetUserId?: string } = {}) => {
        if (targetUserId) socket.leave(`gps:${targetUserId}`);
      });

      // ── Presence ───────────────────────────────────────────────────────────
      socket.on('rt:presence:status', ({ userId, status }: { userId?: string; status?: ExtPresenceStatus } = {}) => {
        if (!userId || !status) return;
        _setPresence(userId, status);
        _broadcastPresence(io, userId);
      });

      socket.on('rt:presence:subscribe', ({ userIds }: { userIds?: string[] } = {}) => {
        if (!userIds?.length) return;
        const snapshots: PresenceSnapshot[] = userIds.map(id =>
          _presence.get(id) ?? { userId: id, status: 'offline', lastSeen: null },
        );
        socket.emit('rt:presence:snapshot', snapshots);
      });

      // ── Dashboard live ─────────────────────────────────────────────────────
      socket.on('rt:dashboard:subscribe', () => {
        _dashboardSubs.add(socket.id);
        _startDashboardTimer(io);
        void _pushDashboard(io); // immediate first push
      });

      // ── Analytics live ─────────────────────────────────────────────────────
      socket.on('rt:analytics:subscribe', () => {
        _analyticsSubs.add(socket.id);
        _startAnalyticsTimer(io);
        void _pushAnalytics(io); // immediate first push
      });

      // ── Offline sync ───────────────────────────────────────────────────────
      socket.on('rt:sync:push', async (data: {
        userId?:   string;
        deviceId?: string;
        ops?:      SyncOperation[];
      } = {}) => {
        if (!data.userId || !data.ops?.length) return;
        const rows = data.ops.map(op => ({
          user_id:   data.userId,
          device_id: data.deviceId ?? 'unknown',
          operation: op as unknown as Record<string, unknown>,
          status:    'pending',
        }));
        const { error } = await db.client().from('rt_sync_queue').insert(rows);
        if (error) { socket.emit('rt:sync:error', { error: error.message }); return; }
        socket.emit('rt:sync:ack', { count: data.ops.length, ts: Date.now() });
      });

      socket.on('rt:sync:pull', async (data: {
        userId?:   string;
        deviceId?: string;
        since?:    number;
      } = {}) => {
        if (!data.userId) return;
        const since = data.since
          ? new Date(data.since).toISOString()
          : new Date(0).toISOString();

        const { data: rows } = await db.client()
          .from('rt_sync_queue')
          .select('*')
          .eq('user_id', data.userId)
          .neq('device_id', data.deviceId ?? '')
          .gte('created_at', since)
          .order('created_at', { ascending: true })
          .limit(500);

        socket.emit('rt:sync:changes', { ops: rows ?? [], ts: Date.now() });

        await db.client()
          .from('rt_sync_checkpoints')
          .upsert(
            { user_id: data.userId, device_id: data.deviceId ?? 'unknown', last_sync_at: new Date().toISOString() },
            { onConflict: 'user_id,device_id' },
          );
      });

      // ── Disconnect ─────────────────────────────────────────────────────────
      socket.on('disconnect', () => {
        _dashboardSubs.delete(socket.id);
        _analyticsSubs.delete(socket.id);

        if (_userId) {
          _setPresence(_userId, 'offline');
          _broadcastPresence(io, _userId);
        }
      });
    });
  },

  // Push realtime event to a specific user from any server-side module
  pushToUser(userId: string, event: string, data: unknown): void {
    if (!_io) return;
    _io.to(`rt:user:${userId}`).emit(event, data);
  },

  // Broadcast to all admin/superadmin sockets
  pushToAdmins(event: string, data: unknown): void {
    if (!_io) return;
    _io.to('role:admin').emit(event, data);
    _io.to('role:superadmin').emit(event, data);
  },
};