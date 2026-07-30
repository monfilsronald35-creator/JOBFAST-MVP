import { db }            from '../../../core/database/SupabaseClient.js';
import type {
  NotifNotification, NotifDelivery, NotifStatus, NotifChannel, DeliveryStatus,
} from '../types/notification.types.js';

function toNotif(r: Record<string, unknown>): NotifNotification {
  return {
    id:          String(r['id'] ?? ''),
    userId:      String(r['user_id'] ?? ''),
    eventType:   r['event_type'] as NotifNotification['eventType'],
    title:       String(r['title'] ?? ''),
    body:        String(r['body'] ?? ''),
    priority:    r['priority'] as NotifNotification['priority'],
    status:      r['status'] as NotifNotification['status'],
    channels:    (r['channels'] as NotifChannel[]) ?? [],
    imageUrl:    r['image_url'] ? String(r['image_url']) : undefined,
    actionUrl:   r['action_url'] ? String(r['action_url']) : undefined,
    data:        r['data'] as Record<string, unknown> | undefined,
    lang:        r['lang'] ? String(r['lang']) : undefined,
    isRead:      Boolean(r['is_read']),
    readAt:      r['read_at'] ? String(r['read_at']) : undefined,
    scheduledAt: r['scheduled_at'] ? String(r['scheduled_at']) : undefined,
    sentAt:      r['sent_at'] ? String(r['sent_at']) : undefined,
    createdAt:   String(r['created_at'] ?? ''),
    updatedAt:   String(r['updated_at'] ?? ''),
  };
}

function toDelivery(r: Record<string, unknown>): NotifDelivery {
  return {
    id:          String(r['id'] ?? ''),
    notifId:     String(r['notif_id'] ?? ''),
    channel:     r['channel'] as NotifChannel,
    status:      r['status'] as DeliveryStatus,
    provider:    r['provider'] ? String(r['provider']) : undefined,
    attempt:     Number(r['attempt'] ?? 1),
    error:       r['error'] ? String(r['error']) : undefined,
    sentAt:      r['sent_at'] ? String(r['sent_at']) : undefined,
    deliveredAt: r['delivered_at'] ? String(r['delivered_at']) : undefined,
    createdAt:   String(r['created_at'] ?? ''),
  };
}

export const NotificationRepository = {
  async create(input: {
    userId:      string;
    eventType:   string;
    title:       string;
    body:        string;
    priority:    string;
    channels:    NotifChannel[];
    data?:       Record<string, unknown> | undefined;
    imageUrl?:   string | undefined;
    actionUrl?:  string | undefined;
    lang?:       string | undefined;
    scheduledAt?: string | undefined;
  }): Promise<NotifNotification> {
    const row: Record<string, unknown> = {
      user_id:    input.userId,
      event_type: input.eventType,
      title:      input.title,
      body:       input.body,
      priority:   input.priority,
      channels:   input.channels,
    };
    if (input.data)        row['data']         = input.data;
    if (input.imageUrl)    row['image_url']    = input.imageUrl;
    if (input.actionUrl)   row['action_url']   = input.actionUrl;
    if (input.lang)        row['lang']         = input.lang;
    if (input.scheduledAt) row['scheduled_at'] = input.scheduledAt;

    const { data, error } = await db.client()
      .from('notif_notifications')
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toNotif(data as Record<string, unknown>);
  },

  async findById(id: string): Promise<NotifNotification | null> {
    const { data } = await db.client()
      .from('notif_notifications')
      .select('*')
      .eq('id', id)
      .single();
    return data ? toNotif(data as Record<string, unknown>) : null;
  },

  async listForUser(userId: string, opts: { limit?: number; cursor?: string; unreadOnly?: boolean } = {}): Promise<NotifNotification[]> {
    let q = db.client()
      .from('notif_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(opts.limit ?? 20);
    if (opts.unreadOnly) q = q.eq('is_read', false);
    if (opts.cursor)     q = q.lt('created_at', opts.cursor);
    const { data } = await q;
    return (data ?? []).map(r => toNotif(r as Record<string, unknown>));
  },

  async markRead(id: string, userId: string): Promise<void> {
    await db.client()
      .from('notif_notifications')
      .update({ is_read: true, read_at: new Date().toISOString(), status: 'read' })
      .eq('id', id)
      .eq('user_id', userId);
  },

  async markAllRead(userId: string): Promise<void> {
    await db.client()
      .from('notif_notifications')
      .update({ is_read: true, read_at: new Date().toISOString(), status: 'read' })
      .eq('user_id', userId)
      .eq('is_read', false);
  },

  async updateStatus(id: string, status: NotifStatus, sentAt?: string): Promise<void> {
    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (sentAt) patch['sent_at'] = sentAt;
    await db.client().from('notif_notifications').update(patch).eq('id', id);
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count } = await db.client()
      .from('notif_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return count ?? 0;
  },

  async createDelivery(input: {
    notifId:   string;
    channel:   NotifChannel;
    provider?: string | undefined;
    attempt:   number;
  }): Promise<NotifDelivery> {
    const row: Record<string, unknown> = {
      notif_id: input.notifId,
      channel:  input.channel,
      attempt:  input.attempt,
    };
    if (input.provider) row['provider'] = input.provider;
    const { data, error } = await db.client()
      .from('notif_deliveries')
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toDelivery(data as Record<string, unknown>);
  },

  async updateDelivery(id: string, patch: { status: DeliveryStatus; error?: string | undefined; sentAt?: string | undefined }): Promise<void> {
    const row: Record<string, unknown> = { status: patch.status };
    if (patch.error)  row['error']    = patch.error;
    if (patch.sentAt) row['sent_at']  = patch.sentAt;
    if (patch.status === 'delivered') row['delivered_at'] = new Date().toISOString();
    await db.client().from('notif_deliveries').update(row).eq('id', id);
  },

  async createDeadLetter(notifId: string, channel: string, error: string, attempts: number): Promise<void> {
    await db.client()
      .from('notif_dead_letters')
      .insert({ notif_id: notifId, channel, error, attempts });
  },
};