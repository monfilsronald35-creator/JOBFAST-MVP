import { TemplateRepository }                from '../repositories/TemplateRepository.js';
import type { NotifTemplate, NotifChannel } from '../types/notification.types.js';
import { NotifEventType }                   from '../types/notification.types.js';

function interpolate(tpl: string, vars: Record<string, unknown>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key as string] ?? ''));
}

export const TemplateService = {
  async render(
    eventType: NotifEventType,
    channel:   NotifChannel,
    lang:      string,
    vars:      Record<string, unknown>,
  ): Promise<{ title: string; body: string; subject?: string | undefined }> {
    const tpl = await TemplateRepository.findWithFallback(eventType, channel, lang);
    if (!tpl) {
      return {
        title: String(vars['title'] ?? eventType),
        body:  String(vars['body'] ?? ''),
      };
    }
    const result: { title: string; body: string; subject?: string | undefined } = {
      title: interpolate(tpl.titleTpl, vars),
      body:  interpolate(tpl.bodyTpl, vars),
    };
    if (tpl.subject) {
      result.subject = interpolate(tpl.subject, vars);
    }
    return result;
  },

  async getTemplate(eventType: NotifEventType, channel: NotifChannel, lang: string): Promise<NotifTemplate | null> {
    return TemplateRepository.findWithFallback(eventType, channel, lang);
  },
};