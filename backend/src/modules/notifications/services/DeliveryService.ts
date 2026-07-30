import { RetryEngine }          from './RetryEngine.js';
import { TemplateService }      from './TemplateService.js';
import { NotificationRepository } from '../repositories/NotificationRepository.js';
import type { NotifNotification, NotifChannel, NotifEventType } from '../types/notification.types.js';
import type { ChannelPayload } from '../providers/ChannelProvider.js';

export const DeliveryService = {
  async dispatch(
    notif:    NotifNotification,
    channels: NotifChannel[],
    to:       string,
    vars:     Record<string, unknown>,
  ): Promise<void> {
    await NotificationRepository.updateStatus(notif.id, 'sending' as NotifNotification['status']);

    const results = await Promise.allSettled(
      channels.map(ch => DeliveryService.deliverChannel(notif, ch, to, vars)),
    );

    const anySuccess = results.some(r => r.status === 'fulfilled' && r.value);
    await NotificationRepository.updateStatus(
      notif.id,
      anySuccess ? 'delivered' : 'failed',
      anySuccess ? new Date().toISOString() : undefined,
    );
  },

  async deliverChannel(
    notif:   NotifNotification,
    channel: NotifChannel,
    to:      string,
    vars:    Record<string, unknown>,
  ): Promise<boolean> {
    const lang = notif.lang ?? 'ht';
    const rendered = await TemplateService.render(
      notif.eventType as NotifEventType,
      channel,
      lang,
      { ...vars, title: notif.title, body: notif.body },
    );

    const payload: ChannelPayload = {
      to,
      title:    rendered.title,
      body:     rendered.body,
      data:     notif.data,
    };
    if (rendered.subject) payload.subject  = rendered.subject;
    if (notif.imageUrl)   payload.imageUrl = notif.imageUrl;

    return RetryEngine.sendWithRetry(notif.id, channel, payload);
  },
};