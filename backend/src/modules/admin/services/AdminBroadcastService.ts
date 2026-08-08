import { db } from '../../../core/database/SupabaseClient.js';
import { TypedEventBus } from '../../../core/events/TypedEventBus.js';
import type { DomainEvent } from '../../../core/events/DomainEvent.js';

export type BroadcastTarget = 'all' | 'country' | 'city' | 'role' | 'user_type' | 'company';
export type BroadcastChannel = 'in_app' | 'push' | 'email' | 'sms';

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  targetType: BroadcastTarget;
  targetValue?: string;
  channels: BroadcastChannel[];
  sentBy: string;
  recipientsCount: number;
  sentAt: number;
  metadata?: Record<string, unknown>;
}

export const AdminBroadcastService = {
  async send(actorId: string, params: {
    title: string;
    body: string;
    targetType: BroadcastTarget;
    targetValue?: string;
    channels?: BroadcastChannel[];
    metadata?: Record<string, unknown>;
  }): Promise<Broadcast> {
    const channels = params.channels ?? ['in_app'];

    // Estimate recipients
    const recipientsCount = await _estimateRecipients(params.targetType, params.targetValue);

    const payload: Record<string, unknown> = {
      title:            params.title,
      body:             params.body,
      target_type:      params.targetType,
      channels,
      sent_by:          actorId,
      recipients_count: recipientsCount,
    };
    if (params.targetValue) payload['target_value'] = params.targetValue;
    if (params.metadata)    payload['metadata']     = params.metadata;

    const { data, error } = await db.client()
      .from('adm_broadcasts')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;

    // Fire event → NotificationPlatform delivers to users
    TypedEventBus.publish({
      eventId:       crypto.randomUUID(),
      eventName:     'admin.broadcast',
      occurredAt:    Date.now(),
      version:       1,
      title:         params.title,
      body:          params.body,
      targetType:    params.targetType,
      targetValue:   params.targetValue,
      channels,
      sentBy:        actorId,
    } as unknown as DomainEvent);

    return _map(data as Record<string, unknown>);
  },

  async list(limit = 20, cursor?: string): Promise<{ items: Broadcast[]; nextCursor?: string }> {
    let q = db.client()
      .from('adm_broadcasts')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(limit + 1);
    if (cursor) q = q.lt('sent_at', cursor);

    const { data, error } = await q;
    if (error) throw error;

    const rows = (data ?? []) as Record<string, unknown>[];
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    const items = rows.map(_map);
    const result: { items: Broadcast[]; nextCursor?: string } = { items };
    const last = items[items.length - 1];
    if (hasMore && last) result.nextCursor = new Date(last.sentAt).toISOString();
    return result;
  },
};

async function _estimateRecipients(targetType: BroadcastTarget, targetValue?: string): Promise<number> {
  const client = db.client();
  let q = client.from('profiles').select('id', { count: 'exact', head: true });
  if (targetType === 'country' && targetValue) {
    // profiles don't have country field directly — estimate all active
    q = client.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active');
  } else if (targetType === 'role' && targetValue) {
    q = client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', targetValue);
  } else if (targetType === 'user_type' && targetValue) {
    q = client.from('profiles').select('id', { count: 'exact', head: true }).eq('user_type', targetValue);
  }
  const result = await q;
  return result.count ?? 0;
}

function _map(row: Record<string, unknown>): Broadcast {
  const b: Broadcast = {
    id:              row['id']              as string,
    title:           row['title']           as string,
    body:            row['body']            as string,
    targetType:      row['target_type']     as BroadcastTarget,
    channels:        (row['channels']       as BroadcastChannel[]) ?? ['in_app'],
    sentBy:          row['sent_by']         as string,
    recipientsCount: (row['recipients_count'] as number) ?? 0,
    sentAt:          new Date(row['sent_at'] as string).getTime(),
  };
  if (row['target_value']) b.targetValue = row['target_value'] as string;
  if (row['metadata'])     b.metadata    = row['metadata'] as Record<string, unknown>;
  return b;
}
