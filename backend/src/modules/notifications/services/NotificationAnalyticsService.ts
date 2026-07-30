import { db } from '../../../core/database/SupabaseClient.js';

interface ChannelStats {
  channel:   string;
  sent:      number;
  delivered: number;
  opened:    number;
  failed:    number;
  ctr:       number;
}

interface DailyStats {
  date:      string;
  sent:      number;
  delivered: number;
  opened:    number;
  failed:    number;
}

export const NotificationAnalyticsService = {
  async getChannelStats(days = 30): Promise<ChannelStats[]> {
    const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const { data } = await db.client()
      .from('notif_analytics')
      .select('channel, sent, delivered, opened, failed')
      .gte('date', from);
    const rows = data ?? [];

    const agg: Record<string, ChannelStats> = {};
    for (const r of rows) {
      const row = r as Record<string, unknown>;
      const ch  = String(row['channel'] ?? '');
      if (!agg[ch]) agg[ch] = { channel: ch, sent: 0, delivered: 0, opened: 0, failed: 0, ctr: 0 };
      agg[ch]!.sent      += Number(row['sent']      ?? 0);
      agg[ch]!.delivered += Number(row['delivered'] ?? 0);
      agg[ch]!.opened    += Number(row['opened']    ?? 0);
      agg[ch]!.failed    += Number(row['failed']    ?? 0);
    }
    return Object.values(agg).map(s => ({
      ...s,
      ctr: s.sent > 0 ? Math.round((s.opened / s.sent) * 10000) / 100 : 0,
    }));
  },

  async getDailyStats(days = 7): Promise<DailyStats[]> {
    const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const { data } = await db.client()
      .from('notif_analytics')
      .select('date, sent, delivered, opened, failed')
      .gte('date', from)
      .order('date', { ascending: true });
    const rows = data ?? [];

    const agg: Record<string, DailyStats> = {};
    for (const r of rows) {
      const row  = r as Record<string, unknown>;
      const date = String(row['date'] ?? '');
      if (!agg[date]) agg[date] = { date, sent: 0, delivered: 0, opened: 0, failed: 0 };
      agg[date]!.sent      += Number(row['sent']      ?? 0);
      agg[date]!.delivered += Number(row['delivered'] ?? 0);
      agg[date]!.opened    += Number(row['opened']    ?? 0);
      agg[date]!.failed    += Number(row['failed']    ?? 0);
    }
    return Object.values(agg);
  },

  async recordSent(channel: string, eventType: string): Promise<void> {
    const date = new Date().toISOString().slice(0, 10);
    await db.client().rpc('notif_upsert_analytics', { p_date: date, p_channel: channel, p_event_type: eventType, p_field: 'sent' });
  },

  async recordDelivered(channel: string, eventType: string): Promise<void> {
    const date = new Date().toISOString().slice(0, 10);
    await db.client().rpc('notif_upsert_analytics', { p_date: date, p_channel: channel, p_event_type: eventType, p_field: 'delivered' });
  },

  async getTopEvents(limit = 10): Promise<Array<{ eventType: string; sent: number }>> {
    const { data } = await db.client()
      .from('notif_analytics')
      .select('event_type, sent')
      .order('sent', { ascending: false })
      .limit(limit);
    return (data ?? []).map(r => ({
      eventType: String((r as Record<string, unknown>)['event_type'] ?? ''),
      sent:      Number((r as Record<string, unknown>)['sent']       ?? 0),
    }));
  },
};