import { db } from '../../../core/database/SupabaseClient.js';
import { TypedEventBus } from '../../../core/events/TypedEventBus.js';
import type { MonetizationAnnouncement } from '../types/monetization.types.js';
import type { DomainEvent } from '../../../core/events/DomainEvent.js';

export const MonetizationAnnouncementService = {
  async announce(
    actorId: string,
    params: {
      type: MonetizationAnnouncement['type'];
      title: string;
      body: string;
      services?: string[];
      metadata?: Record<string, unknown>;
    }
  ): Promise<MonetizationAnnouncement> {
    const recipientsRes = await db.client()
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    const payload: Record<string, unknown> = {
      type:             params.type,
      title:            params.title,
      body:             params.body,
      sent_by:          actorId,
      recipients_count: recipientsRes.count ?? 0,
    };
    if (params.services) payload['services'] = params.services;
    if (params.metadata) payload['metadata'] = params.metadata;

    const { data, error } = await db.client()
      .from('mon_announcements')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;

    // Notify platform — fire and forget
    TypedEventBus.publish({
      eventId:          crypto.randomUUID(),
      eventName:        'monetization.announcement',
      occurredAt:       Date.now(),
      version:          1,
      announcementType: params.type,
      title:            params.title,
      body:             params.body,
      services:         params.services,
      sentBy:           actorId,
    } as unknown as DomainEvent);

    return _map(data as Record<string, unknown>);
  },

  async markModalSeen(userId: string): Promise<void> {
    const { error } = await db.client()
      .from('mon_user_modal_seen')
      .upsert({ user_id: userId, seen_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
  },

  async hasSeenModal(userId: string): Promise<boolean> {
    const { data } = await db.client()
      .from('mon_user_modal_seen')
      .select('user_id')
      .eq('user_id', userId)
      .single();
    return !!data;
  },

  async listAnnouncements(limit = 20): Promise<MonetizationAnnouncement[]> {
    const { data, error } = await db.client()
      .from('mon_announcements')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(_map);
  },
};

function _map(row: Record<string, unknown>): MonetizationAnnouncement {
  const a: MonetizationAnnouncement = {
    id:              row['id'] as string,
    type:            row['type'] as MonetizationAnnouncement['type'],
    title:           row['title'] as string,
    body:            row['body'] as string,
    sentAt:          new Date(row['sent_at'] as string).getTime(),
    sentBy:          row['sent_by'] as string,
    recipientsCount: (row['recipients_count'] as number) ?? 0,
  };
  if (row['services']) a.services = row['services'] as string[];
  return a;
}