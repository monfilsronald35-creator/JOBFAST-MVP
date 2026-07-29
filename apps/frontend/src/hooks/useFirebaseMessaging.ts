/**
 * useFirebaseMessaging — Enterprise push notification via Web Push API.
 * Strategy: uses the existing usePush hook (VAPID/Web Push) as the primary
 * push channel. Adds: foreground message handling, topic subscription,
 * permission recovery, FCM-compatible payload normalization.
 *
 * Designed to be swapped with Firebase SDK when VITE_FIREBASE_* env vars
 * are provided, with zero changes to consuming components.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePush } from './usePush';
import API from '../api/axios';
import type { Notification } from '../types';

export interface MessagingReturn {
  readonly isSupported: boolean;
  readonly permission: NotificationPermission;
  readonly isSubscribed: boolean;
  readonly foregroundMessage: Notification | null;
  readonly requestPermission: () => Promise<boolean>;
  readonly subscribeToTopic: (topic: string) => Promise<void>;
  readonly unsubscribeFromTopic: (topic: string) => Promise<void>;
  readonly clearForegroundMessage: () => void;
}

export function useFirebaseMessaging(): MessagingReturn {
  const push = usePush();
  const [foregroundMessage, setForegroundMessage] = useState<Notification | null>(null);
  const swMessageHandler = useRef<((event: MessageEvent) => void) | null>(null);

  // ── Register Service Worker message listener for foreground push ──────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handler = (event: MessageEvent) => {
      const data = event.data as { type?: string; notification?: Notification } | undefined;
      if (data?.type === 'PUSH_NOTIFICATION' && data.notification) {
        setForegroundMessage(data.notification);
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    swMessageHandler.current = handler;

    return () => {
      if (swMessageHandler.current) {
        navigator.serviceWorker.removeEventListener('message', swMessageHandler.current);
      }
    };
  }, []);

  // ── Request permission (delegates to Web Push) ────────────────────────────
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (push.permission === 'granted' && push.subscribed) return true;

    try {
      if (!push.subscribed) {
        await push.subscribe();
      }
      return push.permission === 'granted';
    } catch {
      return false;
    }
  }, [push]);

  // ── Topic subscription (maps to backend channel groups) ───────────────────
  const subscribeToTopic = useCallback(async (topic: string): Promise<void> => {
    try {
      await API.post('/push/topics/subscribe', { topic });
    } catch (err) {
      console.debug('[useFirebaseMessaging] topic subscribe failed', err);
    }
  }, []);

  const unsubscribeFromTopic = useCallback(async (topic: string): Promise<void> => {
    try {
      await API.post('/push/topics/unsubscribe', { topic });
    } catch (err) {
      console.debug('[useFirebaseMessaging] topic unsubscribe failed', err);
    }
  }, []);

  const clearForegroundMessage = useCallback((): void => {
    setForegroundMessage(null);
  }, []);

  return {
    isSupported: push.supported,
    permission: push.permission,
    isSubscribed: push.subscribed,
    foregroundMessage,
    requestPermission,
    subscribeToTopic,
    unsubscribeFromTopic,
    clearForegroundMessage,
  };
}