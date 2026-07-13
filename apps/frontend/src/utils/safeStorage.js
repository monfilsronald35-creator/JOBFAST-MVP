// Safari Private Mode ak ITP (Intelligent Tracking Prevention) ka jete
// QuotaExceededError sou localStorage.setItem menm lè li pa plen.
// Tout kote nou ekri nan localStorage, nou dwe pase pa fonksyon sa yo.

export function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (_) {
    // Safari Private Mode: silently ignore — user session pral pèdi apre ferme tab
  }
}

export function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (_) {
    return null;
  }
}

export function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (_) {}
}