/**
 * useChat — realtime chat for a single conversation.
 * Replaces useChatSocket.ts for new components.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRealtimeContext } from '../providers/RealtimeProvider';
import type { ChatMessage, TypingPayload, ReactionPayload } from '../types';
import type { PresenceStatus } from '../../types';

export interface UseChatOptions {
  readonly conversationId: string;
  readonly enabled?: boolean;
}

export interface UseChatReturn {
  readonly isConnected:   boolean;
  readonly typingUsers:   readonly string[];
  readonly presenceMap:   Readonly<Record<string, PresenceStatus>>;
  readonly sendMessage:   (msg: Omit<ChatMessage, 'status'> & { status?: string }) => void;
  readonly editMessage:   (messageId: string, content: string) => void;
  readonly deleteMessage: (messageId: string) => void;
  readonly sendTypingStart: () => void;
  readonly sendTypingStop:  () => void;
  readonly sendRead:      (messageIds: readonly string[]) => void;
  readonly sendDelivered: (messageId: string) => void;
  readonly sendReaction:  (payload: ReactionPayload) => void;
  readonly onMessage:     (handler: (msg: ChatMessage) => void) => () => void;
  readonly onEdit:        (handler: (msg: Partial<ChatMessage> & { _id: string }) => void) => () => void;
  readonly onDelete:      (handler: (data: { messageId: string; conversationId: string }) => void) => () => void;
}

export function useChat({ conversationId, enabled = true }: UseChatOptions): UseChatReturn {
  const { chat, presence, isConnected } = useRealtimeContext();
  const [typingUsers, setTypingUsers]   = useState<string[]>([]);
  const [presenceMap, setPresenceMap]   = useState<Record<string, PresenceStatus>>({});
  const currentConvId = useRef(conversationId);
  currentConvId.current = conversationId;

  useEffect(() => {
    if (!enabled || !conversationId) return;

    chat.joinConversation(conversationId);

    const offTyping = chat.onTyping((p: TypingPayload) => {
      if (p.conversationId !== conversationId) return;
      setTypingUsers(prev =>
        p.isTyping
          ? prev.includes(p.userId) ? prev : [...prev, p.userId]
          : prev.filter(id => id !== p.userId)
      );
    });

    const offPresence = presence.onPresenceUpdate(p => {
      setPresenceMap(prev => ({ ...prev, [p.userId]: p.status }));
    });

    return () => {
      chat.leaveConversation(conversationId);
      offTyping();
      offPresence();
      setTypingUsers([]);
    };
  }, [conversationId, enabled, chat, presence]);

  const sendMessage   = useCallback((msg: Omit<ChatMessage, 'status'> & { status?: string }) =>
    chat.sendMessage(msg), [chat]);
  const editMessage   = useCallback((messageId: string, content: string) =>
    chat.editMessage(currentConvId.current, messageId, content), [chat]);
  const deleteMessage = useCallback((messageId: string) =>
    chat.deleteMessage(currentConvId.current, messageId), [chat]);
  const sendTypingStart = useCallback(() =>
    chat.sendTypingStart(currentConvId.current, ''), [chat]);
  const sendTypingStop  = useCallback(() =>
    chat.sendTypingStop(currentConvId.current, ''), [chat]);
  const sendRead = useCallback((messageIds: readonly string[]) =>
    chat.sendReadReceipt({ conversationId: currentConvId.current, messageIds, userId: '', timestamp: Date.now() }),
  [chat]);
  const sendDelivered = useCallback((messageId: string) =>
    chat.sendDelivered({ messageId, conversationId: currentConvId.current, userId: '', deliveredAt: Date.now() }),
  [chat]);
  const sendReaction = useCallback((payload: ReactionPayload) =>
    chat.sendReaction(payload), [chat]);

  const onMessage = useMemo(() => (h: (m: ChatMessage) => void) => chat.onMessage(h), [chat]);
  const onEdit    = useMemo(() => (h: (m: Partial<ChatMessage> & { _id: string }) => void) =>
    chat.onMessageEdit(h), [chat]);
  const onDelete  = useMemo(() => (h: (d: { messageId: string; conversationId: string }) => void) =>
    chat.onMessageDelete(h), [chat]);

  return {
    isConnected,
    typingUsers,
    presenceMap,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTypingStart,
    sendTypingStop,
    sendRead,
    sendDelivered,
    sendReaction,
    onMessage,
    onEdit,
    onDelete,
  };
}