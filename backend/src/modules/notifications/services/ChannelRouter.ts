import { CHANNEL_RULES, EVENT_PRIORITY, NotifChannel, NotifEventType } from '../types/notification.types.js';
import { PreferenceRepository }                                         from '../repositories/PreferenceRepository.js';

export const ChannelRouter = {
  async resolve(userId: string, eventType: NotifEventType, override?: NotifChannel[] | undefined): Promise<NotifChannel[]> {
    const defaultChannels = override ?? CHANNEL_RULES[eventType] ?? [NotifChannel.InApp];

    const isQuiet = await PreferenceRepository.isQuietHour(userId);
    const priority = EVENT_PRIORITY[eventType];

    const filtered: NotifChannel[] = [];
    for (const ch of defaultChannels) {
      // Always deliver critical/emergency regardless of quiet hours or preferences
      if (priority === 'critical' || priority === 'emergency') {
        filtered.push(ch);
        continue;
      }
      // Suppress non-critical during quiet hours (keep in_app as silent inbox)
      if (isQuiet && ch !== NotifChannel.InApp) continue;

      const category  = eventCategoryMap[eventType] ?? 'general';
      const enabled   = await PreferenceRepository.isEnabled(userId, ch, category);
      if (enabled) filtered.push(ch);
    }

    return filtered.length > 0 ? filtered : [NotifChannel.InApp];
  },
};

const eventCategoryMap: Partial<Record<NotifEventType, string>> = {
  [NotifEventType.PaymentSuccess]:    'payments',
  [NotifEventType.PaymentFailed]:     'payments',
  [NotifEventType.RefundApproved]:    'payments',
  [NotifEventType.InvoiceSent]:       'payments',
  [NotifEventType.WalletCredited]:    'payments',
  [NotifEventType.WalletDebited]:     'payments',
  [NotifEventType.JobAssigned]:       'jobs',
  [NotifEventType.JobCreated]:        'jobs',
  [NotifEventType.JobCompleted]:      'jobs',
  [NotifEventType.ApplicationAccepted]: 'jobs',
  [NotifEventType.MessageReceived]:   'messages',
  [NotifEventType.VideoCallIncoming]: 'messages',
  [NotifEventType.BookingConfirmed]:  'commerce',
  [NotifEventType.OrderDelivered]:    'commerce',
  [NotifEventType.Promotion]:         'marketing',
  [NotifEventType.AIRecommendation]:  'marketing',
};