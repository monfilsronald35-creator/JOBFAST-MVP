/**
 * Core Analytics — event tracking, funnels, conversion metrics
 * Writes to Supabase analytics_events table (created lazily via upsert)
 */
import { supabase } from '../config/supabaseClient.js';
import { eventBus, Events } from './eventBus.js';

const BATCH_SIZE = 50;
const FLUSH_MS   = 10_000; // 10 seconds

class Analytics {
  constructor() {
    this._queue = [];
    this._timer = null;
    this._enabled = true;

    // Flush on process exit
    process.on('SIGTERM', () => this._flush());
    process.on('SIGINT',  () => this._flush());
  }

  track(event, properties = {}, userId = null) {
    if (!this._enabled) return;

    const entry = {
      event_name:  event,
      user_id:     userId,
      properties:  properties,
      session_id:  properties.sessionId || null,
      platform:    properties.platform  || 'web',
      ts:          new Date().toISOString(),
    };

    this._queue.push(entry);
    eventBus.publish(Events.ANALYTICS_EVENT, entry);

    if (this._queue.length >= BATCH_SIZE) this._flush();
    else if (!this._timer) {
      this._timer = setTimeout(() => { this._timer = null; this._flush(); }, FLUSH_MS);
      this._timer.unref?.();
    }
  }

  // Convenience wrappers for common events
  trackPageView(page, userId, meta = {})   { this.track('page_view',   { page, ...meta }, userId); }
  trackSignup(userId, method, role)        { this.track('signup',       { method, role }, userId); }
  trackLogin(userId, method)               { this.track('login',        { method }, userId); }
  trackJobPosted(userId, jobId, category)  { this.track('job_posted',   { jobId, category }, userId); }
  trackBooking(userId, bookingId, amount)  { this.track('booking',      { bookingId, amount }, userId); }
  trackPayment(userId, amount, status)     { this.track('payment',      { amount, status }, userId); }
  trackSearch(userId, query, resultCount)  { this.track('search',       { query, resultCount }, userId); }
  trackConversion(userId, type, value)     { this.track('conversion',   { type, value }, userId); }

  async _flush() {
    if (!this._queue.length) return;
    const batch = this._queue.splice(0, BATCH_SIZE);
    try {
      await supabase.from('analytics_events').insert(batch);
    } catch {
      // Non-critical — analytics failure must never impact API response
    }
  }

  disable() { this._enabled = false; }
  enable()  { this._enabled = true; }
}

export const analytics = new Analytics();
export default analytics;
