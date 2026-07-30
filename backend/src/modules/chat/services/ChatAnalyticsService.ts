import { db } from '../../../core/database/SupabaseClient.js';

interface ChatMetrics {
  messagesPerDay:      Record<string, number>;
  totalMessages:       number;
  activeConversations: number;
  avgResponseTime:     number;
  topRooms:            Array<{ roomId: string; messageCount: number }>;
}

export const ChatAnalyticsService = {
  async getMetrics(opts: { from?: string; to?: string; userId?: string } = {}): Promise<ChatMetrics> {
    let q = db.client().from('chat_messages').select('room_id, created_at, sender_id')
      .eq('is_deleted', false);
    if (opts.from)   q = q.gte('created_at', opts.from);
    if (opts.to)     q = q.lte('created_at', opts.to);
    if (opts.userId) q = q.eq('sender_id', opts.userId);

    const { data } = await q.returns<Array<{ room_id: string; created_at: string; sender_id: string }>>();
    const rows = data ?? [];

    const perDay: Record<string, number>     = {};
    const roomCounts: Record<string, number> = {};

    for (const row of rows) {
      const day = row.created_at.slice(0, 10);
      perDay[day]             = (perDay[day]             ?? 0) + 1;
      roomCounts[row.room_id] = (roomCounts[row.room_id] ?? 0) + 1;
    }

    const topRooms = Object.entries(roomCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([roomId, messageCount]) => ({ roomId, messageCount }));

    return {
      messagesPerDay: perDay,
      totalMessages: rows.length,
      activeConversations: Object.keys(roomCounts).length,
      avgResponseTime: 0,
      topRooms,
    };
  },

  async getRoomStats(roomId: string) {
    const { data } = await db.client().from('chat_messages').select('sender_id, created_at')
      .eq('room_id', roomId).eq('is_deleted', false)
      .returns<Array<{ sender_id: string; created_at: string }>>();
    const rows = data ?? [];

    const byUser: Record<string, number> = {};
    for (const row of rows) {
      byUser[row.sender_id] = (byUser[row.sender_id] ?? 0) + 1;
    }

    const first = rows[0];
    const last  = rows[rows.length - 1];
    return {
      totalMessages: rows.length,
      byUser,
      firstMessage: first ? first.created_at : null,
      lastMessage:  last  ? last.created_at  : null,
    };
  },
};
