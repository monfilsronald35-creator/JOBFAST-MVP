/**
 * useNotificationSocket — Real-time notification subscription via Socket.io.
 * Used by pages that need live notification badges (e.g., CategoryMarketplace).
 * Syncs unread count, delivers toast payloads, badge updates — lightweight.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Notification } from '../types';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL as string | undefined ??
  (import.meta.env.PROD
    ? 'https://jobfast-backend.onrender.com'
    : 'http://localhost:5000');

export interface NotificationSocketReturn {
  readonly unreadCount: number;
  readonly latestNotification: Notification | null;
  readonly isConnected: boolean;
  readonly markRead: (notificationId: string) => void;
  readonly clearLatest: () => void;
}

function getStoredToken(): string | null {
  try {
    const user = JSON.parse(localStorage.getItem('jobfast_user') ?? '{}') as { token?: string };
    return user?.token ?? null;
  } catch {
    return null;
  }
}

export function useNotificationSocket(): NotificationSocketReturn {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 2_000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('notifications:subscribe');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('notification:new', (notification: Notification) => {
      setLatestNotification(notification);
      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    socket.on('badge:update', ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    socket.on('notification:read', ({ notificationId }: { notificationId: string }) => {
      if (latestNotification?._id === notificationId) {
        setLatestNotification((prev) => prev ? { ...prev, isRead: true } : null);
      }
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    socket.on('notifications:cleared', () => {
      setUnreadCount(0);
      setLatestNotification(null);
    });

    return () => {
      socket.emit('notifications:unsubscribe');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const markRead = useCallback((notificationId: string): void => {
    socketRef.current?.emit('notification:read', { notificationId });
  }, []);

  const clearLatest = useCallback((): void => {
    setLatestNotification(null);
  }, []);

  return { unreadCount, latestNotification, isConnected, markRead, clearLatest };
}