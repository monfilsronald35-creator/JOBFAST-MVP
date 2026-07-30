import type { UUID, NotificationType, NotificationChannel, UnixMs } from '@shared-types';
import { db } from '../../../core/database/SupabaseClient.js';
import { generateId } from '@shared-utils';

export interface SendNotificationInput {
  userId:     UUID;
  type:       NotificationType;
  title:      string;
  body:       string;
  channels?:  NotificationChannel[];
  imageUrl?:  string;
  actionUrl?: string;
  data?:      Record<string, unknown>;
}

export class NotificationService {
  async send(input: SendNotificationInput): Promise<void> {
    const channels = input.channels ?? ['in_app'];
    const now      = new Date().toISOString();

    // Persist in-app notification
    if (channels.includes('in_app')) {
      await db.query(c =>
        c.from('notifications').insert({
          id:         generateId(),
          user_id:    input.userId,
          type:       input.type,
          title:      input.title,
          body:       input.body,
          image_url:  input.imageUrl,
          action_url: input.actionUrl,
          data:       input.data ?? {},
          is_read:    false,
          created_at: now,
        }),
      );
    }

    // Push channel — delegate to existing push infrastructure
    if (channels.includes('push')) {
      await this._sendPush(input);
    }
  }

  async markRead(userId: UUID, notificationId: UUID): Promise<void> {
    await db.query(c =>
      c.from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId),
    );
  }

  async markAllRead(userId: UUID): Promise<void> {
    await db.query(c =>
      c.from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false),
    );
  }

  async listForUser(userId: UUID, cursor?: string, limit = 20): Promise<{
    items: unknown[]; nextCursor?: string
  }> {
    let q = db.client()
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) q = q.lt('created_at', new Date(Number(cursor)).toISOString());

    const { data, error } = await q;
    if (error) throw error;

    const items      = data ?? [];
    const last       = items.at(-1) as Record<string, unknown> | undefined;
    const nextCursor = last && items.length === limit
      ? String(new Date(last['created_at'] as string).getTime())
      : undefined;

    return { items, nextCursor };
  }

  async getUnreadCount(userId: UUID): Promise<number> {
    const { count, error } = await db.client()
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return count ?? 0;
  }

  private async _sendPush(input: SendNotificationInput): Promise<void> {
    // Delegate to existing web-push infrastructure (backend/src/core/notificationEngine.js)
    // This keeps the new module decoupled from the push implementation detail
    try {
      await fetch('http://localhost:' + (process.env['PORT'] ?? '5000') + '/internal/push', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal': 'true' },
        body:    JSON.stringify({ userId: input.userId, title: input.title, body: input.body, data: input.data }),
      });
    } catch { /* non-fatal — push failure must not crash the notification flow */ }
  }
}
