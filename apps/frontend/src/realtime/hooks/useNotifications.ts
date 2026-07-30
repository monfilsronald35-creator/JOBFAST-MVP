/**
 * useNotifications — in-app notifications, badge count, browser push registration.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRealtimeContext } from '../providers/RealtimeProvider';
import type { Notification } from '../../types';

export interface UseNotificationsReturn {
  readonly unreadCount:        number;
  readonly latestNotification: Notification | null;
  readonly isConnected:        boolean;
  readonly markRead:           (notificationId: string) => void;
  readonly markAllRead:        (userId: string) => void;
  readonly clearLatest:        () => void;
  readonly registerPush:       (userId: string, vapidKey: string) => Promise<boolean>;
}

export function useNotifications(userId?: string): UseNotificationsReturn {
  const { notifications, isConnected } = useRealtimeContext();
  const [unreadCount,        setUnreadCount]        = useState(0);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  useEffect(() => {
    const offNew   = notifications.onNew(n => {
      setLatestNotification(n);
      if (!n.isRead) setUnreadCount(prev => prev + 1);
    });
    const offBadge = notifications.onBadgeUpdate(count => setUnreadCount(count));
    const offRead  = notifications.onRead(id => {
      setLatestNotification(prev =>
        prev?._id === id ? { ...prev, isRead: true } : prev
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    });
    const offClear = notifications.onCleared(() => {
      setUnreadCount(0);
      setLatestNotification(null);
    });

    return () => { offNew(); offBadge(); offRead(); offClear(); };
  }, [notifications]);

  const markRead    = useCallback((id: string) => notifications.markRead(id), [notifications]);
  const markAllRead = useCallback((uid: string) => notifications.markAllRead(uid), [notifications]);
  const clearLatest = useCallback(() => setLatestNotification(null), []);
  const registerPush = useCallback((uid: string, vapidKey: string) =>
    notifications.registerBrowserPush(uid, vapidKey), [notifications]);

  return {
    unreadCount, latestNotification, isConnected,
    markRead, markAllRead, clearLatest, registerPush,
  };
}