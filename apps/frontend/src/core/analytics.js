/**
 * Frontend Analytics — track events, page views, conversions
 * Queues events and sends in batches to /api/v1/ai/analytics (or GA/Mixpanel)
 */
import { api } from './api/client.js';

const SESSION_ID = Math.random().toString(36).slice(2);
const PLATFORM   = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile_web' : 'web';

class AnalyticsClient {
  constructor() {
    this._queue   = [];
    this._timer   = null;
    this._enabled = true;
    this._userId  = null;

    // Flush on page hide (mobile background)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this._flush();
    });
  }

  identify(userId) { this._userId = userId; }

  track(event, properties = {}) {
    if (!this._enabled) return;
    this._queue.push({
      event_name:  event,
      user_id:     this._userId,
      session_id:  SESSION_ID,
      platform:    PLATFORM,
      properties:  { ...properties, url: window.location.pathname, ts: Date.now() },
    });
    if (!this._timer) {
      this._timer = setTimeout(() => { this._timer = null; this._flush(); }, 5_000);
    }
  }

  page(name, properties = {}) { this.track('page_view', { page: name, ...properties }); }
  click(element, properties = {}) { this.track('click', { element, ...properties }); }
  search(query, results) { this.track('search', { query, results }); }
  conversion(type, value) { this.track('conversion', { type, value }); }
  error(message, context) { this.track('frontend_error', { message, context }); }

  async _flush() {
    if (!this._queue.length) return;
    const batch = this._queue.splice(0, 50);
    try {
      await api.post('/analytics', { events: batch });
    } catch { /* non-blocking */ }
  }

  disable() { this._enabled = false; }
  enable()  { this._enabled = true; }
}

export const analytics = new AnalyticsClient();
export default analytics;
