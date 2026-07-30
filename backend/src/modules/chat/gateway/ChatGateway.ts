/**
 * ChatGateway — Socket.IO real-time hub
 * Called from server.ts: ChatGateway.init(io)
 *
 * Events emitted to clients:
 *   chat:message          — new message in a room
 *   chat:message_edited   — message was edited
 *   chat:message_deleted  — message was deleted
 *   chat:typing           — typing indicator update
 *   chat:presence         — user presence change
 *   chat:read             — read receipt update
 *   chat:reaction         — emoji reaction added/removed
 *   chat:call_offer       — incoming call (caller → callee)
 *   chat:call_answer      — call answered
 *   chat:call_ice         — ICE candidate exchange (WebRTC)
 *   chat:call_end         — call ended
 *   chat:member_joined    — new member joined room
 *   chat:member_left      — member left room
 */
import type { Server, Socket } from 'socket.io';
import { MessageService }    from '../services/MessageService.js';
import { PresenceService }   from '../services/PresenceService.js';
import { ReadReceiptService } from '../services/ReadReceiptService.js';
import { CallService }       from '../services/CallService.js';
import { TranslationService } from '../services/TranslationService.js';
import { MessageType }       from '../types/chat.types.js';
import type { CallType }     from '../types/chat.types.js';

// userId → socketId map for direct delivery
const userSockets = new Map<string, Set<string>>();

function registerUser(userId: string, socketId: string): void {
  let sockets = userSockets.get(userId);
  if (!sockets) { sockets = new Set(); userSockets.set(userId, sockets); }
  sockets.add(socketId);
}

function unregisterUser(userId: string, socketId: string): void {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) userSockets.delete(userId);
}

export const ChatGateway = {
  init(io: Server): void {
    io.on('connection', (socket: Socket) => {
      // ── Auth ──────────────────────────────────────────────────────────────────
      socket.on('auth:join', async ({ userId, role }: { userId?: string; role?: string } = {}) => {
        if (userId) {
          socket.join(`user:${userId}`);
          registerUser(userId, socket.id);
          await PresenceService.setOnline(userId);
          socket.broadcast.emit('chat:presence', { userId, status: 'online' });
        }
        if (role) socket.join(`role:${role}`);
      });

      socket.on('auth:logout', async ({ userId }: { userId?: string } = {}) => {
        if (userId) {
          socket.leave(`user:${userId}`);
          unregisterUser(userId, socket.id);
          await PresenceService.setOffline(userId);
          socket.broadcast.emit('chat:presence', { userId, status: 'offline' });
        }
      });

      socket.on('disconnect', async () => {
        // Find and remove this socket from user mapping
        for (const [userId, sockets] of userSockets) {
          if (sockets.has(socket.id)) {
            unregisterUser(userId, socket.id);
            if (!userSockets.has(userId)) {
              await PresenceService.setOffline(userId);
              socket.broadcast.emit('chat:presence', { userId, status: 'offline' });
            }
          }
        }
      });

      // ── Room management ───────────────────────────────────────────────────────
      socket.on('chat:join_room', ({ roomId }: { roomId?: string } = {}) => {
        if (roomId) socket.join(`room:${roomId}`);
      });

      socket.on('chat:leave_room', ({ roomId }: { roomId?: string } = {}) => {
        if (roomId) socket.leave(`room:${roomId}`);
      });

      // ── Messaging ─────────────────────────────────────────────────────────────
      socket.on('chat:send_message', async (data: {
        userId?: string; roomId?: string; content?: string;
        type?: string; replyToId?: string; metadata?: Record<string, unknown>;
      } = {}) => {
        if (!data.userId || !data.roomId) return;
        try {
          const message = await MessageService.send({
            roomId:   data.roomId,
            senderId: data.userId,
            type:     (data.type ?? MessageType.Text) as MessageType,
            content:  data.content,
            replyToId: data.replyToId,
            metadata: data.metadata,
          });
          // Broadcast to all room members
          io.to(`room:${data.roomId}`).emit('chat:message', message);
        } catch (err) {
          socket.emit('chat:error', { event: 'send_message', error: err instanceof Error ? err.message : 'Error' });
        }
      });

      socket.on('chat:edit_message', async ({ userId, messageId, content, roomId }: {
        userId?: string; messageId?: string; content?: string; roomId?: string;
      } = {}) => {
        if (!userId || !messageId || !content) return;
        try {
          const updated = await MessageService.edit(messageId, userId, content);
          io.to(`room:${roomId}`).emit('chat:message_edited', updated);
        } catch (err) {
          socket.emit('chat:error', { event: 'edit_message', error: err instanceof Error ? err.message : 'Error' });
        }
      });

      socket.on('chat:delete_message', async ({ userId, messageId, roomId }: {
        userId?: string; messageId?: string; roomId?: string;
      } = {}) => {
        if (!userId || !messageId || !roomId) return;
        try {
          await MessageService.delete(messageId, userId, roomId);
          io.to(`room:${roomId}`).emit('chat:message_deleted', { messageId, roomId });
        } catch (err) {
          socket.emit('chat:error', { event: 'delete_message', error: err instanceof Error ? err.message : 'Error' });
        }
      });

      // ── Typing indicators ─────────────────────────────────────────────────────
      socket.on('chat:typing_start', ({ userId, roomId }: { userId?: string; roomId?: string } = {}) => {
        if (!userId || !roomId) return;
        PresenceService.startTyping(roomId, userId);
        socket.to(`room:${roomId}`).emit('chat:typing', {
          roomId, userId, typing: true,
          users: PresenceService.getTypingUsers(roomId),
        });
      });

      socket.on('chat:typing_stop', ({ userId, roomId }: { userId?: string; roomId?: string } = {}) => {
        if (!userId || !roomId) return;
        PresenceService.stopTyping(roomId, userId);
        socket.to(`room:${roomId}`).emit('chat:typing', {
          roomId, userId, typing: false,
          users: PresenceService.getTypingUsers(roomId),
        });
      });

      // ── Read receipts ─────────────────────────────────────────────────────────
      socket.on('chat:mark_read', async ({ userId, roomId, messageIds }: {
        userId?: string; roomId?: string; messageIds?: string[];
      } = {}) => {
        if (!userId || !roomId || !messageIds?.length) return;
        await ReadReceiptService.markRoomRead(roomId, userId, messageIds);
        socket.to(`room:${roomId}`).emit('chat:read', { userId, roomId, messageIds, readAt: new Date().toISOString() });
      });

      // ── Reactions ─────────────────────────────────────────────────────────────
      socket.on('chat:react', async ({ userId, messageId, emoji, roomId, remove }: {
        userId?: string; messageId?: string; emoji?: string; roomId?: string; remove?: boolean;
      } = {}) => {
        if (!userId || !messageId || !emoji) return;
        if (remove) {
          await MessageService.unreact(messageId, userId, emoji);
        } else {
          await MessageService.react(messageId, userId, emoji);
        }
        io.to(`room:${roomId}`).emit('chat:reaction', { messageId, userId, emoji, remove: !!remove });
      });

      // ── Presence ──────────────────────────────────────────────────────────────
      socket.on('chat:set_status', async ({ userId, status }: { userId?: string; status?: string } = {}) => {
        if (!userId || !status) return;
        await PresenceService.setStatus(userId, status as import('../types/chat.types.js').PresenceStatus);
        socket.broadcast.emit('chat:presence', { userId, status });
      });

      // ── Translation ───────────────────────────────────────────────────────────
      socket.on('chat:translate', async ({ messageId, content, targetLang }: {
        messageId?: string; content?: string; targetLang?: string;
      } = {}) => {
        if (!messageId || !content || !targetLang) return;
        try {
          const translated = await TranslationService.translate(messageId, content, targetLang);
          socket.emit('chat:translated', { messageId, targetLang, translated });
        } catch (err) {
          socket.emit('chat:error', { event: 'translate', error: err instanceof Error ? err.message : 'Error' });
        }
      });

      // ── Voice/Video Calls (WebRTC signaling) ───────────────────────────────────
      socket.on('chat:call_offer', async ({ callerId, roomId, type, sdp }: {
        callerId?: string; roomId?: string; type?: string; sdp?: unknown;
      } = {}) => {
        if (!callerId || !roomId) return;
        try {
          const call = await CallService.initiate(roomId, callerId, (type ?? 'voice') as CallType);
          // Broadcast offer to all room members except caller
          socket.to(`room:${roomId}`).emit('chat:call_offer', { callId: call.id, callerId, type: call.type, sdp });
        } catch (err) {
          socket.emit('chat:error', { event: 'call_offer', error: err instanceof Error ? err.message : 'Error' });
        }
      });

      socket.on('chat:call_answer', async ({ callId, userId, sdp }: {
        callId?: string; userId?: string; sdp?: unknown;
      } = {}) => {
        if (!callId || !userId) return;
        try {
          const call = await CallService.answer(callId, userId);
          io.to(`room:${call.roomId}`).emit('chat:call_answer', { callId, userId, sdp });
        } catch (err) {
          socket.emit('chat:error', { event: 'call_answer', error: err instanceof Error ? err.message : 'Error' });
        }
      });

      socket.on('chat:call_ice', ({ callId, userId, candidate, roomId }: {
        callId?: string; userId?: string; candidate?: unknown; roomId?: string;
      } = {}) => {
        if (!callId || !roomId) return;
        socket.to(`room:${roomId}`).emit('chat:call_ice', { callId, userId, candidate });
      });

      socket.on('chat:call_end', async ({ callId, userId, roomId }: {
        callId?: string; userId?: string; roomId?: string;
      } = {}) => {
        if (!callId || !userId) return;
        try {
          await CallService.end(callId, userId);
          if (roomId) io.to(`room:${roomId}`).emit('chat:call_end', { callId });
        } catch (err) {
          socket.emit('chat:error', { event: 'call_end', error: err instanceof Error ? err.message : 'Error' });
        }
      });

      socket.on('chat:call_decline', async ({ callId, userId, roomId }: {
        callId?: string; userId?: string; roomId?: string;
      } = {}) => {
        if (!callId || !userId) return;
        await CallService.decline(callId, userId);
        if (roomId) io.to(`room:${roomId}`).emit('chat:call_end', { callId, declined: true });
      });
    });
  },

  // Utility: push message to specific user (used by Notification service integration)
  pushToUser(io: Server, userId: string, event: string, data: unknown): void {
    io.to(`user:${userId}`).emit(event, data);
  },

  pushToRoom(io: Server, roomId: string, event: string, data: unknown): void {
    io.to(`room:${roomId}`).emit(event, data);
  },
};
