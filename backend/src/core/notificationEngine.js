/**
 * Core Notification Engine — multi-channel: in-app (Socket.io) + push (FCM stub) + email stub
 * Decoupled via event bus so any service can notify without knowing the transport
 */
import { eventBus, Events } from './eventBus.js';
import { getIO } from '../utils/io.js';
import { supabase } from '../config/supabaseClient.js';

// Notification types — keep in sync with frontend
export const NotifType = {
  JOB_ASSIGNED:     'job_assigned',
  JOB_COMPLETED:    'job_completed',
  BOOKING_NEW:      'booking_new',
  BOOKING_ACCEPTED: 'booking_accepted',
  BOOKING_CANCELLED:'booking_cancelled',
  MESSAGE_NEW:      'message_new',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_SENT:     'payment_sent',
  REVIEW_NEW:       'review_new',
  SYSTEM:           'system',
  PROMO:            'promo',
};

class NotificationEngine {
  constructor() {
    // Listen on event bus for decoupled delivery
    eventBus.subscribe(Events.NOTIFY_USER, envelope => {
      const { userId, type, data } = envelope.data || {};
      if (userId && type) this.send(userId, type, data).catch(() => {});
    });

    eventBus.subscribe(Events.NOTIFY_BROADCAST, envelope => {
      const { role, type, data } = envelope.data || {};
      this.broadcast(role, type, data).catch(() => {});
    });
  }

  async send(userId, type, data = {}) {
    const notification = {
      user_id:    userId,
      type,
      title:      data.title || this._defaultTitle(type),
      body:       data.body  || '',
      action_url: data.actionUrl || null,
      metadata:   data.metadata  || {},
      is_read:    false,
      created_at: new Date().toISOString(),
    };

    // 1. Persist to DB
    try {
      await supabase.from('notifications').insert(notification);
    } catch { /* non-fatal */ }

    // 2. Push via Socket.io (in-app real-time)
    this._socketPush(userId, notification);

    // 3. Web push stub (FCM/APNS)
    this._webPush(userId, notification);

    return notification;
  }

  async broadcast(role, type, data = {}) {
    const io = getIO();
    if (io && role) {
      io.to(`role:${role}`).emit('notification', {
        type,
        title: data.title || this._defaultTitle(type),
        body:  data.body  || '',
      });
    }
  }

  _socketPush(userId, notification) {
    try {
      const io = getIO();
      if (io) io.to(`user:${userId}`).emit('notification', notification);
    } catch { /* socket not ready */ }
  }

  _webPush(userId, notification) {
    // TODO: integrate FCM/APNS via push.service.js
    // pushService.send(userId, { title: notification.title, body: notification.body });
  }

  _defaultTitle(type) {
    const titles = {
      [NotifType.JOB_ASSIGNED]:     'Travay asiyé!',
      [NotifType.JOB_COMPLETED]:    'Travay fini!',
      [NotifType.BOOKING_NEW]:      'Nouvo rezervasyon',
      [NotifType.BOOKING_ACCEPTED]: 'Rezervasyon aksepte',
      [NotifType.BOOKING_CANCELLED]:'Rezervasyon anile',
      [NotifType.MESSAGE_NEW]:      'Nouvo mesaj',
      [NotifType.PAYMENT_RECEIVED]: 'Peman resevwa',
      [NotifType.PAYMENT_SENT]:     'Peman voye',
      [NotifType.REVIEW_NEW]:       'Nouvo evalyasyon',
      [NotifType.SYSTEM]:           'Enfòmasyon sistèm',
      [NotifType.PROMO]:            'Ofè espesyal',
    };
    return titles[type] || 'JOBFAST';
  }
}

export const notificationEngine = new NotificationEngine();
export default notificationEngine;
