import { api } from './api/client';

const SESSION_ID = Math.random().toString(36).slice(2);
const PLATFORM   = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile_web' : 'web';

interface AnalyticsEvent {
  event_name: string;
  user_id:    string | null;
  session_id: string;
  platform:   string;
  properties: Record<string, unknown>;
}

class AnalyticsClient {
  private _queue:   AnalyticsEvent[] = [];
  private _timer:   ReturnType<typeof setTimeout> | null = null;
  private _enabled: boolean = true;
  private _userId:  string | null = null;

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this._flush();
    });
  }

  identify(userId: string): void { this._userId = userId; }

  track(event: string, properties: Record<string, unknown> = {}): void {
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

  page(name: string, properties: Record<string, unknown> = {}): void   { this.track('page_view', { page: name, ...properties }); }
  click(element: string, properties: Record<string, unknown> = {}): void { this.track('click', { element, ...properties }); }
  search(query: string, results: number): void                          { this.track('search', { query, results }); }
  conversion(type: string, value: number): void                         { this.track('conversion', { type, value }); }
  error(message: string, context: unknown): void                        { this.track('frontend_error', { message, context }); }

  private async _flush(): Promise<void> {
    if (!this._queue.length) return;
    const batch = this._queue.splice(0, 50);
    try {
      await api.post('/analytics', { events: batch });
    } catch { /* non-blocking */ }
  }

  disable(): void { this._enabled = false; }
  enable():  void { this._enabled = true; }
}

export const analytics = new AnalyticsClient();
export default analytics;