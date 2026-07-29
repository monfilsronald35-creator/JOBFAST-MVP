import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

const SW_URL = '/sw.js';

type Permission = NotificationPermission;

interface SubscribeResult { ok: boolean; reason?: string; }

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePush() {
  const [supported,  setSupported]  = useState(false);
  const [permission, setPermission] = useState<Permission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading,    setLoading]    = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration(SW_URL);
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    setSubscribed(!!sub);
  }, []);

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window);
    setPermission((Notification?.permission as Permission) || 'default');
    checkSubscription();
  }, [checkSubscription]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (e: MessageEvent<{ type?: string; url?: string }>) => {
      if (e.data?.type === 'PUSH_NAV' && e.data.url) window.location.href = e.data.url;
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  const registerSW = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const existing = await navigator.serviceWorker.getRegistration(SW_URL);
      if (existing) return existing;
      return await navigator.serviceWorker.register(SW_URL, { scope: '/' });
    } catch { return null; }
  }, []);

  const subscribe = useCallback(async (): Promise<SubscribeResult> => {
    if (!supported) return { ok: false, reason: 'not-supported' };
    setLoading(true);
    try {
      const reg = await registerSW();
      if (!reg) return { ok: false, reason: 'sw-failed' };

      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return { ok: false, reason: 'denied' };

      const { data: keyData } = await API.get<{ publicKey?: string }>('/push/vapid-key');
      const publicKey = keyData?.publicKey;
      if (!publicKey) return { ok: false, reason: 'no-key' };

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await API.post('/push/subscribe', sub.toJSON());
      setSubscribed(true);
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    } finally {
      setLoading(false);
    }
  }, [supported, registerSW]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_URL);
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await API.post('/push/unsubscribe', { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally { setLoading(false); }
  }, []);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}