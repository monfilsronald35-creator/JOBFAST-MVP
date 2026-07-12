import webpush from 'web-push';

// VAPID keys — generated once, hardcoded for MVP
// Public key is also used by frontend (VITE_VAPID_PUBLIC_KEY)
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || 'BEYp3HeoqECbPkRjvC9tbxKYGh78TSTbLhCQDAit2TJaMJo2IzN7HDh796TLhoq77zhPafq-soRz1ZK2iKj9Wv4';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'tqolbiqIvR_SNeH6NH_MIPycoW-XeV143-pLfIsO7tA';

webpush.setVapidDetails('mailto:monfilsronald35@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE);

// In-memory subscription store (MVP — survives Render instance lifetime)
// Key: endpoint string, Value: subscription object
const subscriptions = new Map();

// ── Save/update push subscription ────────────────────────────────────────────
export async function subscribePush(req, res) {
  const sub = req.body;
  if (!sub?.endpoint) return res.status(400).json({ success: false, message: 'Invalid subscription' });
  subscriptions.set(sub.endpoint, sub);
  return res.json({ success: true, message: 'Subscribed', count: subscriptions.size });
}

// ── Remove push subscription ──────────────────────────────────────────────────
export async function unsubscribePush(req, res) {
  const { endpoint } = req.body;
  subscriptions.delete(endpoint);
  return res.json({ success: true });
}

// ── Get VAPID public key (frontend needs this to subscribe) ──────────────────
export function getVapidKey(req, res) {
  return res.json({ success: true, publicKey: VAPID_PUBLIC });
}

// ── Send push to ALL subscribed devices ──────────────────────────────────────
export async function sendPushToAll(req, res) {
  const { title = 'JOBFAST', body = 'Ou gen yon nouvo notifikasyon', icon, url = '/', badge } = req.body || {};
  const payload = JSON.stringify({ title, body, icon: icon || '/favicon.ico', url, badge });

  const dead = [];
  const sends = [...subscriptions.values()].map(sub =>
    webpush.sendNotification(sub, payload)
      .catch(() => dead.push(sub.endpoint))
  );

  await Promise.allSettled(sends);
  dead.forEach(e => subscriptions.delete(e));

  return res.json({ success: true, sent: subscriptions.size, removed: dead.length });
}

// ── Send push to a specific user endpoint ────────────────────────────────────
export async function sendPushToOne(req, res) {
  const { endpoint, title, body, url = '/', icon } = req.body || {};
  const sub = subscriptions.get(endpoint);
  if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });

  const payload = JSON.stringify({ title, body, icon: icon || '/favicon.ico', url });
  try {
    await webpush.sendNotification(sub, payload);
    return res.json({ success: true });
  } catch (e) {
    subscriptions.delete(endpoint);
    return res.status(410).json({ success: false, message: 'Subscription expired' });
  }
}

// ── Utility: call from anywhere in backend to push a notification ─────────────
export async function pushNotification({ title, body, url = '/', icon, targets = 'all' }) {
  if (subscriptions.size === 0) return;
  const payload = JSON.stringify({ title, body, icon: icon || '/favicon.ico', url });

  const list = targets === 'all' ? [...subscriptions.values()] : targets.filter(e => subscriptions.has(e)).map(e => subscriptions.get(e));
  const dead = [];
  await Promise.allSettled(
    list.map(sub => webpush.sendNotification(sub, payload).catch(() => dead.push(sub.endpoint)))
  );
  dead.forEach(e => subscriptions.delete(e));
}
