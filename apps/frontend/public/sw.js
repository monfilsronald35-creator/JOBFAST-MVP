// JOBFAST Service Worker v2 — Push Notifications + Smart Offline Cache
const CACHE_NAME = 'jobfast-v2';

// ── Install: cache only true static assets (NOT index.html) ──────────────────
self.addEventListener('install', (e) => {
  self.skipWaiting(); // activate immediately, don't wait for old SW to die
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll([
        '/manifest.json',
        '/favicon.ico',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
        '/apple-touch-icon.png',
      ]).catch(() => {})
    )
  );
});

// ── Activate: delete old caches (jobfast-v1, etc.) ───────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // take control of all open tabs immediately
  );
});

// ── Fetch: smart strategy by request type ────────────────────────────────────
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;
  if (e.request.url.includes('/api/')) return; // never cache API calls

  // NAVIGATION (HTML pages) → network-first so we always get the latest index.html
  // This is the critical fix: avoids serving a stale HTML that references old JS bundles
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .catch(() => caches.match('/index.html')) // offline fallback only
    );
    return;
  }

  // STATIC ASSETS (JS, CSS, images, fonts) → cache-first, update in background
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});

// ── Push: receive from backend and show notification ─────────────────────────
self.addEventListener('push', (e) => {
  let data = {
    title: 'JOBFAST',
    body:  'Ou gen yon nouvo notifikasyon',
    url:   '/',
    icon:  '/icons/icon-192x192.png',
  };
  try { data = { ...data, ...e.data.json() }; } catch (_) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:     data.body,
      icon:     data.icon || '/icons/icon-192x192.png',
      badge:    '/icons/icon-96x96.png',
      tag:      'jobfast-push',
      renotify: true,
      vibrate:  [200, 100, 200, 100, 400],
      data:     { url: data.url || '/' },
      actions:  [
        { action: 'open',    title: 'Ouvri'  },
        { action: 'dismiss', title: 'Fèmen'  },
      ],
    })
  );
});

// ── Notification click: open or focus app ────────────────────────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'dismiss') return;

  const targetUrl = e.notification.data?.url || '/dashboard';

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin)) {
          client.focus();
          client.postMessage({ type: 'PUSH_NAV', url: targetUrl });
          return;
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ── Background sync ───────────────────────────────────────────────────────────
self.addEventListener('sync', (e) => {
  if (e.tag === 'retry-api') {
    // Future: replay queued mutations
  }
});
