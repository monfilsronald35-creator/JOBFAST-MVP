import { NotificationRepository }  from '../repositories/NotificationRepository.js';
import { ChannelRouter }           from './ChannelRouter.js';
import { DeliveryService }         from './DeliveryService.js';
import { SchedulingService }       from './SchedulingService.js';
import {
  NotifChannel,
  NotifEventType,
  NotifStatus,
  EVENT_PRIORITY,
} from '../types/notification.types.js';
import type { NotifNotification, SendNotifInput } from '../types/notification.types.js';

export const NotificationOrchestratorService = {
  async send(input: SendNotifInput, recipientContact: string, io?: unknown): Promise<NotifNotification> {
    // Resolve active channels (respects preferences + quiet hours)
    const channels = await ChannelRouter.resolve(
      input.userId,
      input.eventType,
      input.channels,
    );

    const priority = EVENT_PRIORITY[input.eventType] ?? 'normal';

    const notif = await NotificationRepository.create({
      userId:    input.userId,
      eventType: input.eventType,
      title:     input.title,
      body:      input.body,
      priority,
      channels,
      data:      input.data,
      imageUrl:  input.imageUrl,
      actionUrl: input.actionUrl,
      lang:      input.lang ?? 'ht',
      scheduledAt: input.scheduledAt,
    });

    // Schedule for later delivery
    if (input.scheduledAt) {
      await SchedulingService.scheduleDelayed(notif.id, input.scheduledAt);
      return notif;
    }

    // Push real-time in-app via Socket.IO if available
    if (io && channels.includes(NotifChannel.InApp)) {
      const ioServer = io as { to: (room: string) => { emit: (event: string, data: unknown) => void } };
      ioServer.to(`user:${input.userId}`).emit('notification:new', notif);
    }

    const vars: Record<string, unknown> = {
      ...(input.data ?? {}),
      title:  input.title,
      body:   input.body,
      userId: input.userId,
    };

    // Fire delivery async — don't block response
    void DeliveryService.dispatch(notif, channels, recipientContact, vars);

    return notif;
  },

  async markRead(id: string, userId: string): Promise<void> {
    await NotificationRepository.markRead(id, userId);
  },

  async markAllRead(userId: string): Promise<void> {
    await NotificationRepository.markAllRead(userId);
  },

  async list(userId: string, opts: { limit?: number; cursor?: string; unreadOnly?: boolean } = {}): Promise<NotifNotification[]> {
    return NotificationRepository.listForUser(userId, opts);
  },

  async getUnreadCount(userId: string): Promise<number> {
    return NotificationRepository.getUnreadCount(userId);
  },

  async processScheduled(): Promise<void> {
    const pending = await SchedulingService.getPendingSchedules();
    for (const s of pending) {
      const notif = await NotificationRepository.findById(s.notifId);
      if (!notif) { await SchedulingService.markProcessed(s.id); continue; }

      void DeliveryService.dispatch(
        notif,
        notif.channels,
        notif.userId,
        { title: notif.title, body: notif.body, ...(notif.data ?? {}) },
      );
      await SchedulingService.markProcessed(s.id);
    }
  },

  async cancel(id: string, userId: string): Promise<void> {
    await NotificationRepository.updateStatus(id, NotifStatus.Cancelled);
    void userId;
  },
};