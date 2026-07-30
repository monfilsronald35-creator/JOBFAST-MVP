/**
 * Payments Module — FAZ 18
 * Global Payment Intelligence Engine
 * Owns: intents, transactions, routing, failover, fraud, 3DS, split, refunds, subscriptions, analytics, webhooks
 * Providers: Stripe, PayPal, Adyen, Braintree, MonCash, NatCash, M-Pesa, MTN MoMo, Orange Money, ...
 * All amounts in integer minor units. Routes to best provider per country/currency/method.
 * Listens to: JOB_COMPLETED → release_escrow
 * Emits: ESCROW_LOCKED, ESCROW_RELEASED, PAYMENT_COMPLETED, PAYMENT_FAILED
 */
import type { Express }    from 'express';
import { DomainEvent }     from '../../core/events/DomainEvent.js';
import { TypedEventBus }   from '../../core/events/TypedEventBus.js';
import { EVENT_NAMES }     from '@shared-events';
import type { UUID, MinorUnits, Currency } from '@shared-types';
import paymentRoutes       from './routes/payment.routes.js';

// Domain events (re-exported for other modules to use)
export class EscrowLockedEvent extends DomainEvent {
  constructor(public readonly jobId: UUID, public readonly amount: MinorUnits, public readonly currency: Currency) {
    super(EVENT_NAMES.ESCROW_LOCKED);
  }
}

export class EscrowReleasedEvent extends DomainEvent {
  constructor(public readonly jobId: UUID, public readonly userId: UUID, public readonly amount: MinorUnits, public readonly currency: Currency) {
    super(EVENT_NAMES.ESCROW_RELEASED);
  }
}

export function registerPaymentsModule(app: Express): void {
  // Mount all payment routes under /api/payments
  app.use('/api/payments', paymentRoutes);

  // Release escrow when job completes (cross-module event)
  TypedEventBus.subscribe(EVENT_NAMES.JOB_COMPLETED, async (envelope) => {
    try {
      const payload = envelope.payload as unknown as { jobId: UUID; workerId: UUID; budget: MinorUnits; currency: Currency };
      const { db }  = await import('../../core/database/SupabaseClient.js');
      await db.client().rpc('release_escrow', { p_job_id: payload.jobId }).throwOnError();
      TypedEventBus.publish(new EscrowReleasedEvent(payload.jobId, payload.workerId, payload.budget, payload.currency));
    } catch (err) {
      console.error('[payments] JOB_COMPLETED escrow release failed:', err);
    }
  });
}
