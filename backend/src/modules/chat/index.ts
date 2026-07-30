/**
 * Chat Module — FAZ 19
 * Global Communication Platform
 * Owns: rooms, messages, presence, read receipts, calls, attachments, translations, moderation
 * Real-time: Socket.IO via ChatGateway (init called from server.ts)
 * Listens to: JOB_ASSIGNED → auto-create direct room between client and worker
 * Emits: MESSAGE_SENT, ROOM_CREATED
 */
import type { Express }    from 'express';
import { DomainEvent }     from '../../core/events/DomainEvent.js';
import { TypedEventBus }   from '../../core/events/TypedEventBus.js';
import { EVENT_NAMES }     from '@shared-events';
import type { UUID }        from '@shared-types';
import chatRoutes           from './routes/chat.routes.js';
import { RoomService }      from './services/RoomService.js';

// Domain events (re-exported)
export class MessageSentEvent extends DomainEvent {
  constructor(
    public readonly roomId: UUID,
    public readonly senderId: UUID,
    public readonly messageId: UUID,
  ) { super(EVENT_NAMES.MESSAGE_SENT); }
}

export class RoomCreatedEvent extends DomainEvent {
  constructor(public readonly roomId: UUID, public readonly createdBy: UUID) {
    super('chat.room_created');
  }
}

export function registerChatModule(app: Express): void {
  app.use('/api/chat', chatRoutes);

  // Auto-create direct room when a job is assigned (client ↔ worker communication)
  TypedEventBus.subscribe(EVENT_NAMES.JOB_ASSIGNED, async (envelope) => {
    try {
      const payload = envelope.payload as unknown as { clientId: UUID; workerId: UUID; jobId: UUID };
      await RoomService.createDirect(payload.clientId, payload.workerId);
    } catch (err) {
      console.error('[chat] JOB_ASSIGNED room creation failed:', err);
    }
  });
}
