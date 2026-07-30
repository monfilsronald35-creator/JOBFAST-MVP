import type { Request, Response, NextFunction } from 'express';
import { PaymentRepository }                   from '../repositories/PaymentRepository.js';
import { PaymentStatus, RefundStatus, SubscriptionStatus } from '../types/payment.types.js';

export const WebhookController = {
  async receive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider  = String(req.params['provider'] ?? 'unknown');
      const payload   = req.body as unknown as Record<string, unknown>;
      const eventType = String(payload['event'] ?? 'unknown');

      const webhookId = await PaymentRepository.saveWebhook(provider, eventType, payload);

      // Idempotent event processing
      const rawData = payload['data'];
      const data    = (rawData != null && typeof rawData === 'object')
        ? rawData as Record<string, unknown>
        : {} as Record<string, unknown>;

      if (eventType === 'payment.completed' || eventType === 'charge.succeeded') {
        const meta     = (typeof data['metadata'] === 'object' && data['metadata'] != null)
          ? data['metadata'] as Record<string, unknown> : {};
        const intentId = String(data['intentId'] ?? meta['intentId'] ?? '');
        if (intentId) await PaymentRepository.updateIntent(intentId, { status: PaymentStatus.Completed });
      }

      if (eventType === 'payment.failed' || eventType === 'charge.failed') {
        const meta     = (typeof data['metadata'] === 'object' && data['metadata'] != null)
          ? data['metadata'] as Record<string, unknown> : {};
        const intentId = String(data['intentId'] ?? meta['intentId'] ?? '');
        if (intentId) await PaymentRepository.updateIntent(intentId, { status: PaymentStatus.Failed });
      }

      if (eventType === 'refund.completed') {
        const refundId = String(data['refundId'] ?? '');
        if (refundId) await PaymentRepository.updateRefund(refundId, { status: RefundStatus.Completed });
      }

      if (eventType === 'subscription.renewed') {
        const subId = String(data['subscriptionId'] ?? '');
        if (subId) await PaymentRepository.updateSubscription(subId, { status: SubscriptionStatus.Active });
      }

      await PaymentRepository.markWebhookProcessed(webhookId);
      res.json({ received: true });
    } catch (err) { next(err); }
  },
};
