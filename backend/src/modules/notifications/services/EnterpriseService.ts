import { db }                      from '../../../core/database/SupabaseClient.js';
import { NotificationRepository }  from '../repositories/NotificationRepository.js';
import { ChannelRouter }           from './ChannelRouter.js';
import { DeliveryService }         from './DeliveryService.js';
import {
  NotifEventType,
  NotifChannel,
  EVENT_PRIORITY,
} from '../types/notification.types.js';
import type { NotifCampaign } from '../types/notification.types.js';

function toCampaign(r: Record<string, unknown>): NotifCampaign {
  return {
    id:               String(r['id'] ?? ''),
    name:             String(r['name'] ?? ''),
    eventType:        r['event_type'] as NotifEventType,
    channels:         (r['channels'] as NotifChannel[]) ?? [],
    title:            String(r['title'] ?? ''),
    body:             String(r['body'] ?? ''),
    targetRoles:      r['target_roles'] as string[] | undefined,
    targetCountries:  r['target_countries'] as string[] | undefined,
    targetLangs:      r['target_langs'] as string[] | undefined,
    scheduledAt:      r['scheduled_at'] ? String(r['scheduled_at']) : undefined,
    sentAt:           r['sent_at'] ? String(r['sent_at']) : undefined,
    totalTargets:     Number(r['total_targets'] ?? 0),
    sentCount:        Number(r['sent_count'] ?? 0),
    createdBy:        String(r['created_by'] ?? ''),
    createdAt:        String(r['created_at'] ?? ''),
  };
}

export const EnterpriseService = {
  async createCampaign(input: {
    name:            string;
    eventType:       NotifEventType;
    channels:        NotifChannel[];
    title:           string;
    body:            string;
    createdBy:       string;
    targetRoles?:    string[] | undefined;
    targetCountries?: string[] | undefined;
    targetLangs?:    string[] | undefined;
    scheduledAt?:    string | undefined;
  }): Promise<NotifCampaign> {
    const row: Record<string, unknown> = {
      name:       input.name,
      event_type: input.eventType,
      channels:   input.channels,
      title:      input.title,
      body:       input.body,
      created_by: input.createdBy,
    };
    if (input.targetRoles)    row['target_roles']     = input.targetRoles;
    if (input.targetCountries) row['target_countries'] = input.targetCountries;
    if (input.targetLangs)    row['target_langs']     = input.targetLangs;
    if (input.scheduledAt)    row['scheduled_at']     = input.scheduledAt;

    const { data, error } = await db.client()
      .from('notif_campaigns')
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCampaign(data as Record<string, unknown>);
  },

  async broadcast(opts: {
    title:           string;
    body:            string;
    eventType:       NotifEventType;
    channels:        NotifChannel[];
    targetRoles?:    string[] | undefined;
    targetCountries?: string[] | undefined;
    targetLangs?:    string[] | undefined;
    createdBy:       string;
  }): Promise<{ queued: number }> {
    let q = db.client().from('profiles').select('id, email, preferred_lang, country');
    if (opts.targetRoles)    q = q.in('role', opts.targetRoles);
    if (opts.targetCountries) q = q.in('country', opts.targetCountries);

    const { data: users } = await q;
    const targets = users ?? [];

    let queued = 0;
    for (const u of targets) {
      const user = u as Record<string, unknown>;
      const userId = String(user['id'] ?? '');
      const lang   = String(user['preferred_lang'] ?? 'ht');

      if (opts.targetLangs && !opts.targetLangs.includes(lang)) continue;

      const channels = await ChannelRouter.resolve(userId, opts.eventType, opts.channels);
      const notif = await NotificationRepository.create({
        userId,
        eventType: opts.eventType,
        title:     opts.title,
        body:      opts.body,
        priority:  EVENT_PRIORITY[opts.eventType],
        channels,
        lang,
      });

      const to = String(user['email'] ?? userId);
      void DeliveryService.dispatch(notif, channels, to, { title: opts.title, body: opts.body });
      queued++;
    }

    return { queued };
  },

  async listCampaigns(limit = 20): Promise<NotifCampaign[]> {
    const { data } = await db.client()
      .from('notif_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data ?? []).map(r => toCampaign(r as Record<string, unknown>));
  },
};