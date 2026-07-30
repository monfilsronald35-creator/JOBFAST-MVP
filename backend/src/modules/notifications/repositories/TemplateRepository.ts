import { db }           from '../../../core/database/SupabaseClient.js';
import type { NotifTemplate, NotifChannel } from '../types/notification.types.js';
import { NotifEventType } from '../types/notification.types.js';

function toTemplate(r: Record<string, unknown>): NotifTemplate {
  return {
    id:        String(r['id'] ?? ''),
    eventType: r['event_type'] as NotifEventType,
    channel:   r['channel'] as NotifChannel,
    lang:      String(r['lang'] ?? 'ht'),
    subject:   r['subject'] ? String(r['subject']) : undefined,
    titleTpl:  String(r['title_tpl'] ?? ''),
    bodyTpl:   String(r['body_tpl'] ?? ''),
    richHtml:  r['rich_html'] ? String(r['rich_html']) : undefined,
    isActive:  Boolean(r['is_active'] ?? true),
    createdAt: String(r['created_at'] ?? ''),
    updatedAt: String(r['updated_at'] ?? ''),
  };
}

export const TemplateRepository = {
  async find(eventType: NotifEventType, channel: NotifChannel, lang: string): Promise<NotifTemplate | null> {
    const { data } = await db.client()
      .from('notif_templates')
      .select('*')
      .eq('event_type', eventType)
      .eq('channel', channel)
      .eq('lang', lang)
      .eq('is_active', true)
      .single();
    return data ? toTemplate(data as Record<string, unknown>) : null;
  },

  async findWithFallback(eventType: NotifEventType, channel: NotifChannel, lang: string): Promise<NotifTemplate | null> {
    const exact = await TemplateRepository.find(eventType, channel, lang);
    if (exact) return exact;
    if (lang !== 'ht') return TemplateRepository.find(eventType, channel, 'ht');
    return null;
  },

  async listByEvent(eventType: NotifEventType): Promise<NotifTemplate[]> {
    const { data } = await db.client()
      .from('notif_templates')
      .select('*')
      .eq('event_type', eventType)
      .eq('is_active', true);
    return (data ?? []).map(r => toTemplate(r as Record<string, unknown>));
  },

  async upsert(input: {
    eventType: NotifEventType; channel: NotifChannel; lang: string;
    titleTpl: string; bodyTpl: string; subject?: string | undefined;
  }): Promise<NotifTemplate> {
    const row: Record<string, unknown> = {
      event_type: input.eventType,
      channel:    input.channel,
      lang:       input.lang,
      title_tpl:  input.titleTpl,
      body_tpl:   input.bodyTpl,
    };
    if (input.subject) row['subject'] = input.subject;
    const { data, error } = await db.client()
      .from('notif_templates')
      .upsert(row, { onConflict: 'event_type,channel,lang' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toTemplate(data as Record<string, unknown>);
  },
};