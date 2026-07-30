/**
 * ChatChannel — realtime messaging, typing, reactions, receipts, file sharing.
 * Room pattern: `chat:{conversationId}`
 */

import { BaseChannel } from './BaseChannel';
import type { RealtimeEngine } from '../core/RealtimeEngine';
import type {
  ChatMessage, TypingPayload, ReactionPayload,
  ReadReceiptPayload, DeliveryReceiptPayload, FileSharePayload,
} from '../types';

export class ChatChannel extends BaseChannel {
  #activeRooms = new Set<string>();

  constructor(engine: RealtimeEngine) {
    super(engine, 'chat');
  }

  // ── Room management ─────────────────────────────────────────────────────────

  joinConversation(conversationId: string): void {
    if (this.#activeRooms.has(conversationId)) return;
    this.#activeRooms.add(conversationId);
    this.engine.emit('chat:join', { conversationId }, 'high');
  }

  leaveConversation(conversationId: string): void {
    this.#activeRooms.delete(conversationId);
    this.engine.emit('chat:leave', { conversationId }, 'normal');
  }

  // ── Outbound ────────────────────────────────────────────────────────────────

  sendMessage(msg: Omit<ChatMessage, 'status'> & { status?: string }): void {
    this.engine.emit('chat:message:send', msg, 'high');
  }

  editMessage(conversationId: string, messageId: string, content: string): void {
    this.engine.emit('chat:message:edit', { conversationId, messageId, content }, 'normal');
  }

  deleteMessage(conversationId: string, messageId: string): void {
    this.engine.emit('chat:message:delete', { conversationId, messageId }, 'high');
  }

  sendTypingStart(conversationId: string, userId: string): void {
    this.engine.emit('chat:typing:start', { conversationId, userId }, 'low');
  }

  sendTypingStop(conversationId: string, userId: string): void {
    this.engine.emit('chat:typing:stop', { conversationId, userId }, 'low');
  }

  sendReadReceipt(payload: ReadReceiptPayload): void {
    this.engine.emit('chat:read', payload, 'normal');
  }

  sendDelivered(payload: DeliveryReceiptPayload): void {
    this.engine.emit('chat:delivered', payload, 'normal');
  }

  sendReaction(payload: ReactionPayload): void {
    this.engine.emit('chat:reaction', payload, 'normal');
  }

  // ── Inbound ─────────────────────────────────────────────────────────────────

  onMessage(handler: (msg: ChatMessage) => void): () => void {
    return this.onGlobal('message:new', handler);
  }

  onMessageEdit(handler: (msg: Partial<ChatMessage> & { _id: string }) => void): () => void {
    return this.onGlobal('message:edit', handler);
  }

  onMessageDelete(handler: (data: { messageId: string; conversationId: string }) => void): () => void {
    return this.onGlobal('message:delete', handler);
  }

  onTyping(handler: (payload: TypingPayload) => void): () => void {
    const startOff = this.onGlobal<{ conversationId: string; userId: string }>('typing:start', d =>
      handler({ ...d, isTyping: true })
    );
    const stopOff = this.onGlobal<{ conversationId: string; userId: string }>('typing:stop', d =>
      handler({ ...d, isTyping: false })
    );
    return () => { startOff(); stopOff(); };
  }

  onReadReceipt(handler: (payload: ReadReceiptPayload) => void): () => void {
    return this.onGlobal('message:read', handler);
  }

  onDelivered(handler: (payload: DeliveryReceiptPayload) => void): () => void {
    return this.onGlobal('message:delivered', handler);
  }

  onReaction(handler: (payload: ReactionPayload) => void): () => void {
    return this.onGlobal('message:reaction', handler);
  }

  onFileShare(handler: (payload: FileSharePayload) => void): () => void {
    return this.onGlobal('chat:file:shared', handler);
  }

  // ── Voice / Video presence ──────────────────────────────────────────────────

  announceVoicePresence(conversationId: string, userId: string, active: boolean): void {
    this.engine.emit('chat:voice:presence', { conversationId, userId, active }, 'high');
  }

  onVoicePresence(handler: (data: { conversationId: string; userId: string; active: boolean }) => void): () => void {
    return this.onGlobal('chat:voice:presence', handler);
  }

  announceVideoPresence(conversationId: string, userId: string, active: boolean): void {
    this.engine.emit('chat:video:presence', { conversationId, userId, active }, 'high');
  }

  onVideoPresence(handler: (data: { conversationId: string; userId: string; active: boolean }) => void): () => void {
    return this.onGlobal('chat:video:presence', handler);
  }

  protected override onDestroy(): void {
    this.#activeRooms.forEach(id => this.leaveConversation(id));
    this.#activeRooms.clear();
  }
}