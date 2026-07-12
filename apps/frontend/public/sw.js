// JOBFAST Service Worker — Push Notifications + Offline Cache
const CACHE_NAME = 'jobfast-v1';

// ── Install: cache shell ──────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(['/', '/index.html', '/manifest.json', '/favicon.ico']).catch(() => {})
    )
  );
});

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: serve from cache first, network fallback ──────────────────────────
self.addEventListener('fetch', (e) => {
  // Only cache GET requests to same origin
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;
  // Never cache API calls
  if (e.request.url.includes('/api/')) return;

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ── Push: receive from backend and show notification ─────────────────────────
self.addEventListener('push', (e) => {
  let data = { title: 'JOBFAST', body: 'Ou gen yon nouvo notifikasyon', url: '/', icon: '/favicon.ico' };
  try { data = { ...data, ...e.data.json() }; } catch (_) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    data.icon || '/favicon.ico',
      badge:   '/favicon.ico',
      tag:     'jobfast-push',
      renotify: true,
      vibrate: [200, 100, 200, 100, 400],   // vibre: ×-·-×-·-×
      data:    { url: data.url || '/' },
      actions: [
        { action: 'open',    title: 'Ouvri' },
        { action: 'dismiss', title: 'Fèmen' },
      ],
    })
  );
});

// ── Notification click: open or focus app ─────────────────────────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'dismiss') return;

  const targetUrl = e.notification.data?.url || '/';

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // If app already open, focus it and navigate
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin)) {
          client.focus();
          client.postMessage({ type: 'PUSH_NAV', url: targetUrl });
          return;
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ── Background sync: retry failed API calls when back online ─────────────────
self.addEventListener('sync', (e) => {
  if (e.tag === 'retry-api') {
    // Future: replay queued mutations
  }
});
