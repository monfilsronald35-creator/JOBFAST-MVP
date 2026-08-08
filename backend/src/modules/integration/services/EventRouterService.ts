import { TypedEventBus } from '../../../core/events/TypedEventBus.js';
import { db } from '../../../core/database/SupabaseClient.js';
import type { DomainEvent } from '../../../core/events/DomainEvent.js';

export const EventRouterService = {
  init(): void {
    TypedEventBus.subscribeAll(async (event: DomainEvent) => {
      const eventName = event.eventName;
      try {
        await _routeToWebhooks(eventName, {
          eventId:   event.eventId,
          eventName,
          occurredAt: event.occurredAt,
          data:      (event as unknown as Record<string, unknown>)['data'] ?? {},
        });
      } catch {
        // Never let routing errors crash the main event bus
      }
    });
  },
};

async function _routeToWebhooks(
  eventName: string,
  payload:   Record<string, unknown>,
): Promise<void> {
  const { data } = await db.client()
    .from('int_webhooks')
    .select('id, url, secret, events')
    .eq('active', true);

  const hooks = (data ?? []) as Array<{
    id: string;
    url: string;
    secret: string;
    events: string[];
  }>;

  const matching = hooks.filter(h =>
    h.events.length === 0 || h.events.includes(eventName) || h.events.includes('*'),
  );

  if (matching.length === 0) return;

  // Lazy import to avoid potential circular dependency at module init time
  const { WebhookService } = await import('./WebhookService.js');

  await Promise.allSettled(
    matching.map(hook => WebhookService.deliver(hook.id, eventName, payload)),
  );
}
