// JOBFAST Service Worker v4 — Cross-Platform PWA (Android + iPhone + iPad)
// Stratèji: Network-first pou navigasyon, Cache-first pou assets statik

const CACHE_NAME    = 'jobfast-v5';
const OFFLINE_URL   = '/offline.html';

// Fichye ki pre-cache pandan install (okenn pa dwe manke)
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/apple-touch-icon.png',
];

// ── INSTALL ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      // addAll a tout-ou-anyen; itilize Promise.allSettled pou pwoteje kont 404
      Promise.allSettled(
        PRECACHE_URLS.map(url => cache.add(url).catch(() => {}))
      )
    )
  );
});

// ── ACTIVATE ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  // Sèlman GET
  if (e.request.method !== 'GET') return;

  // Pa cache: cross-origin requests
  if (!e.request.url.startsWith(self.location.origin)) return;

  // Pa cache: API calls — toujou network
  if (e.request.url.includes('/api/')) return;

  // Pa cache: socket.io
  if (e.request.url.includes('/socket.io/')) return;

  const url = new URL(e.request.url);

  // ── NAVIGASYON (HTML) → Network-first, ofline fallback
  // Kritik pou Safari iOS: evite sèvi yon vye index.html ki pa gen bon JS bundle
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .then(response => {
          // Met cache yon kopi fre
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() =>
          // Offline: sèvi index.html cache a (SPA) oswa offline.html
          caches.match('/').then(cached => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // ── ASSETS STATIK (JS, CSS, imaj, font) → Cache-first, update background
  // Sa pèmèt aplikasyon an deplase menm san koneksyon
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot)$/.test(url.pathname)
  ) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const networkFetch = fetch(e.request)
          .then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
            }
            return response;
          })
          .catch(() => cached); // offline: sèvi cache a
        return cached || networkFetch;
      })
    );
    return;
  }

  // ── TOUT LÒT: Network-first, cache fallback
  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── PUSH NOTIFICATIONS ────────────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  let data = {
    title: 'JOBFAST',
    body:  'Ou gen yon nouvo notifikasyon',
    url:   '/notifications',
    icon:  '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
  };

  try {
    if (e.data) data = { ...data, ...e.data.json() };
  } catch (_) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:     data.body,
      icon:     data.icon,
      badge:    data.badge,
      tag:      'jobfast-push',
      renotify: true,
      vibrate:  [200, 100, 200, 100, 400],
      data:     { url: data.url },
      actions: [
        { action: 'open',    title: 'Ouvri'  },
        { action: 'dismiss', title: 'Fèmen'  },
      ],
    })
  );
});

// ── NOTIFICATION CLICK ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'dismiss') return;

  const targetUrl = e.notification.data?.url || '/dashboard';

  e.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        // Si app la deja ouvè: focus + navige
        const existing = clients.find(c =>
          c.url.startsWith(self.location.origin) && 'focus' in c
        );
        if (existing) {
          existing.focus();
          existing.postMessage({ type: 'PUSH_NAV', url: targetUrl });
          return;
        }
        // Sinon: ouvri yon nouvo fenèt
        return self.clients.openWindow(targetUrl);
      })
  );
});

// ── BACKGROUND SYNC ───────────────────────────────────────────────────────────
self.addEventListener('sync', (e) => {
  if (e.tag === 'retry-api') {
    // Pou lavni: rejoue mutations ki te rate pandan offline
  }
});

// ── MESSAGE (depi main thread) ────────────────────────────────────────────────
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});