/**
 * useChatSocket — Enterprise real-time chat via Socket.io.
 * Manages the full lifecycle of a chat connection for one conversation:
 * message delivery, typing indicators, presence, ping/pong heartbeat,
 * read receipts, reactions, and optimistic UI updates.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ChatMessage, MessageStatus, PresenceStatus } from '../types';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL as string | undefined ??
  (import.meta.env.PROD
    ? 'https://jobfast-backend.onrender.com'
    : 'http://localhost:5000');

const PING_INTERVAL_MS = 25_000;

export interface ChatSocketOptions {
  readonly conversationId: string;
  readonly enabled?: boolean;
}

export interface ChatSocketReturn {
  readonly isConnected: boolean;
  readonly isTyping: boolean;
  readonly typingUsers: readonly string[];
  readonly presenceMap: Record<string, PresenceStatus>;
  readonly sendTypingStart: () => void;
  readonly sendTypingStop: () => void;
  readonly sendDelivered: (messageIds: readonly string[]) => void;
  readonly sendRead: (messageIds: readonly string[]) => void;
  readonly onMessage: (handler: (msg: ChatMessage) => void) => () => void;
  readonly onMessageEdit: (handler: (msg: Partial<ChatMessage> & { _id: string }) => void) => () => void;
  readonly onMessageDelete: (handler: (messageId: string) => void) => () => void;
  readonly onStatusChange: (handler: (messageId: string, status: MessageStatus, userId: string) => void) => () => void;
  readonly socket: Socket | null;
}

function getStoredToken(): string | null {
  try {
    const user = JSON.parse(localStorage.getItem('jobfast_user') ?? '{}') as { token?: string };
    return user?.token ?? null;
  } catch {
    return null;
  }
}

export function useChatSocket(options: ChatSocketOptions): ChatSocketReturn {
  const { conversationId, enabled = true } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceStatus>>({});

  const socketRef = useRef<Socket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageHandlers = useRef<Set<(msg: ChatMessage) => void>>(new Set());
  const editHandlers = useRef<Set<(msg: Partial<ChatMessage> & { _id: string }) => void>>(new Set());
  const deleteHandlers = useRef<Set<(id: string) => void>>(new Set());
  const statusHandlers = useRef<Set<(id: string, status: MessageStatus, userId: string) => void>>(new Set());

  useEffect(() => {
    if (!enabled || !conversationId) return;

    const token = getStoredToken();
    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: token ? { token } : {},
      reconnectionAttempts: 10,
      reconnectionDelay: 1_500,
      reconnectionDelayMax: 15_000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('chat:join', { conversationId });

      if (pingRef.current) clearInterval(pingRef.current);
      pingRef.current = setInterval(() => {
        socket.emit('ping');
      }, PING_INTERVAL_MS);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      if (pingRef.current) {
        clearInterval(pingRef.current);
        pingRef.current = null;
      }
    });

    socket.on('message:new', (msg: ChatMessage) => {
      messageHandlers.current.forEach((h) => h(msg));
    });

    socket.on('message:edit', (msg: Partial<ChatMessage> & { _id: string }) => {
      editHandlers.current.forEach((h) => h(msg));
    });

    socket.on('message:delete', ({ messageId }: { messageId: string }) => {
      deleteHandlers.current.forEach((h) => h(messageId));
    });

    socket.on(
      'message:delivered',
      ({ messageId, userId }: { messageId: string; userId: string }) => {
        statusHandlers.current.forEach((h) => h(messageId, 'delivered', userId));
      },
    );

    socket.on(
      'message:read',
      ({ messageId, userId }: { messageId: string; userId: string }) => {
        statusHandlers.current.forEach((h) => h(messageId, 'read', userId));
      },
    );

    socket.on('typing:start', ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => prev.includes(userId) ? prev : [...prev, userId]);
    });

    socket.on('typing:stop', ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    });

    socket.on(
      'presence:update',
      ({ userId, status }: { userId: string; status: PresenceStatus }) => {
        setPresenceMap((prev) => ({ ...prev, [userId]: status }));
      },
    );

    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
      socket.emit('chat:leave', { conversationId });
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [conversationId, enabled]);

  const sendTypingStart = useCallback((): void => {
    socketRef.current?.emit('typing:start', { conversationId });
  }, [conversationId]);

  const sendTypingStop = useCallback((): void => {
    socketRef.current?.emit('typing:stop', { conversationId });
  }, [conversationId]);

  const sendDelivered = useCallback(
    (messageIds: readonly string[]): void => {
      if (messageIds.length === 0) return;
      socketRef.current?.emit('message:delivered', { messageIds, conversationId });
    },
    [conversationId],
  );

  const sendRead = useCallback(
    (messageIds: readonly string[]): void => {
      if (messageIds.length === 0) return;
      socketRef.current?.emit('message:read', { messageIds, conversationId });
    },
    [conversationId],
  );

  const onMessage = useCallback((handler: (msg: ChatMessage) => void): (() => void) => {
    messageHandlers.current.add(handler);
    return () => { messageHandlers.current.delete(handler); };
  }, []);

  const onMessageEdit = useCallback(
    (handler: (msg: Partial<ChatMessage> & { _id: string }) => void): (() => void) => {
      editHandlers.current.add(handler);
      return () => { editHandlers.current.delete(handler); };
    },
    [],
  );

  const onMessageDelete = useCallback((handler: (id: string) => void): (() => void) => {
    deleteHandlers.current.add(handler);
    return () => { deleteHandlers.current.delete(handler); };
  }, []);

  const onStatusChange = useCallback(
    (
      handler: (id: string, status: MessageStatus, userId: string) => void,
    ): (() => void) => {
      statusHandlers.current.add(handler);
      return () => { statusHandlers.current.delete(handler); };
    },
    [],
  );

  return {
    isConnected,
    isTyping: typingUsers.length > 0,
    typingUsers,
    presenceMap,
    sendTypingStart,
    sendTypingStop,
    sendDelivered,
    sendRead,
    onMessage,
    onMessageEdit,
    onMessageDelete,
    onStatusChange,
    socket: socketRef.current,
  };
}