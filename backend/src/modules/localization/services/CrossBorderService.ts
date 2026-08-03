/**
 * CrossBorderService — detects when a user moves to a new country
 * and prompts them to switch their localization context.
 *
 * Detection logic:
 *   1. Current request's detected country ≠ user's stored context country
 *   2. Confidence ≥ 70 (GPS or IP, not just Accept-Language)
 *   3. No unconfirmed event for the same transition in the last 30 minutes
 *      (prevents repeated prompts during a single trip)
 */
import { db }                      from '../../../core/database/SupabaseClient.js';
import { TypedEventBus }            from '../../../core/events/TypedEventBus.js';
import type { CrossBorderEvent }    from '../types/localization.types.js';
import type { DetectionResult }     from './CountryDetectionService.js';

export const CrossBorderService = {
  /**
   * Check if a cross-border transition should be prompted.
   * Returns the event if a prompt should be shown, null otherwise.
   */
  async checkTransition(
    userId: string,
    currentCountry: string,
    detection: DetectionResult,
  ): Promise<CrossBorderEvent | null> {
    if (detection.country === currentCountry) return null;
    if (detection.confidence < 70)           return null;  // low-confidence signals don't trigger

    const thirtyMinAgo = new Date(Date.now() - 30 * 60_000).toISOString();

    // Check for a recent unconfirmed event for same transition
    const { data: recent } = await db.client()
      .from('loc_cross_border_events')
      .select('id')
      .eq('user_id', userId)
      .eq('from_country', currentCountry)
      .eq('to_country', detection.country)
      .eq('confirmed', false)
      .gte('detected_at', thirtyMinAgo)
      .maybeSingle();

    if (recent) return null;  // already prompted recently

    // Create a new cross-border event
    const { data } = await db.client()
      .from('loc_cross_border_events')
      .insert({
        user_id:      userId,
        from_country: currentCountry,
        to_country:   detection.country,
        detected_at:  new Date().toISOString(),
        confirmed:    false,
      })
      .select('id, user_id, from_country, to_country, detected_at, confirmed')
      .single();

    if (!data) return null;

    const ev = data as Record<string, unknown>;
    const event: CrossBorderEvent = {
      id:          String(ev['id'] ?? ''),
      userId:      String(ev['user_id'] ?? ''),
      fromCountry: String(ev['from_country'] ?? ''),
      toCountry:   String(ev['to_country'] ?? ''),
      detectedAt:  String(ev['detected_at'] ?? ''),
      confirmed:   Boolean(ev['confirmed']),
    };

    TypedEventBus.publish({
      eventId:    crypto.randomUUID(),
      eventName:  'localization.cross_border_detected',
      occurredAt: Date.now(),
      version:    1,
      userId, fromCountry: currentCountry, toCountry: detection.country,
    } as unknown as import('../../../core/events/DomainEvent.js').DomainEvent);

    return event;
  },

  /**
   * Confirm a cross-border transition (user tapped "Yes, use X services").
   */
  async confirm(eventId: string, userId: string): Promise<void> {
    await db.client()
      .from('loc_cross_border_events')
      .update({ confirmed: true })
      .eq('id', eventId)
      .eq('user_id', userId);
  },

  /**
   * Dismiss a cross-border prompt (user tapped "No, stay in current country").
   * Mark as confirmed (so we don't reprompt) but don't change their context.
   */
  async dismiss(eventId: string, userId: string): Promise<void> {
    await db.client()
      .from('loc_cross_border_events')
      .update({ confirmed: true })
      .eq('id', eventId)
      .eq('user_id', userId);
  },

  /**
   * List recent cross-border events for a user (for history / analytics).
   */
  async listForUser(userId: string, limit = 20): Promise<CrossBorderEvent[]> {
    const { data } = await db.client()
      .from('loc_cross_border_events')
      .select('*')
      .eq('user_id', userId)
      .order('detected_at', { ascending: false })
      .limit(limit);

    return ((data ?? []) as Record<string, unknown>[]).map(r => ({
      id:          String(r['id']           ?? ''),
      userId:      String(r['user_id']      ?? ''),
      fromCountry: String(r['from_country'] ?? ''),
      toCountry:   String(r['to_country']   ?? ''),
      detectedAt:  String(r['detected_at']  ?? ''),
      confirmed:   Boolean(r['confirmed']),
    }));
  },
};