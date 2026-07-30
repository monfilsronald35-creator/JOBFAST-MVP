import type { UUID, NotificationType, NotificationChannel, UnixMs } from '@shared-types';
import { randomUUID } from 'crypto';

export class Notification {
  readonly id:       UUID;
  readonly userId:   UUID;
  type:              NotificationType;
  title:             string;
  body:              string;
  imageUrl?:         string;
  actionUrl?:        string;
  data?:             Record<string, unknown>;
  channels:          NotificationChannel[];
  isRead:            boolean;
  readAt?:           UnixMs;
  sentAt?:           UnixMs;
  readonly createdAt: UnixMs;

  constructor(params: {
    userId:     UUID;
    type:       NotificationType;
    title:      string;
    body:       string;
    channels:   NotificationChannel[];
    imageUrl?:  string;
    actionUrl?: string;
    data?:      Record<string, unknown>;
  }) {
    this.id        = randomUUID();
    this.userId    = params.userId;
    this.type      = params.type;
    this.title     = params.title;
    this.body      = params.body;
    this.channels  = params.channels;
    this.imageUrl  = params.imageUrl;
    this.actionUrl = params.actionUrl;
    this.data      = params.data;
    this.isRead    = false;
    this.createdAt = Date.now();
  }

  markRead(): void {
    this.isRead = true;
    this.readAt = Date.now();
  }

  markSent(): void {
    this.sentAt = Date.now();
  }
}
