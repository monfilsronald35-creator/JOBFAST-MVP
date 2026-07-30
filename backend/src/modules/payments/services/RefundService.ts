import { PaymentRepository }                  from '../repositories/PaymentRepository.js';
import { ProviderRegistry }                   from '../providers/ProviderAdapter.js';
import { AppError }                           from '../../../core/errors/AppError.js';
import { PaymentStatus, RefundStatus }        from '../types/payment.types.js';
import type { Refund }                         from '../types/payment.types.js';

const REFUND_WINDOW_DAYS = 30;

export const RefundService = {
  async request(intentId: string, userId: string, amount: number, reason: string): Promise<Refund> {
    const intent = await PaymentRepository.findIntent(intentId);
    if (!intent) throw new AppError('Payment not found', 404, 'NOT_FOUND');
    if (intent.userId !== userId) throw new AppError('Not authorized', 403, 'FORBIDDEN');
    if (intent.status !== PaymentStatus.Completed && intent.status !== PaymentStatus.Captured)
      throw new AppError('Payment is not in a refundable state', 400, 'INVALID_STATE');

    const daysSince = (Date.now() - new Date(intent.createdAt).getTime()) / (1000 * 86400);
    if (daysSince > REFUND_WINDOW_DAYS)
      throw new AppError(`Refund window of ${REFUND_WINDOW_DAYS} days has passed`, 400, 'REFUND_WINDOW_EXPIRED');

    if (amount > intent.amount)
      throw new AppError('Refund amount exceeds original payment', 400, 'INVALID_AMOUNT');

    return PaymentRepository.createRefund({
      intentId, userId, amount, currency: intent.currency, reason,
      status: RefundStatus.Pending,
    });
  },

  async process(refundId: string): Promise<Refund> {
    const { data: refunds } = await (async () => {
      // Lookup refund by joining — simplified: find from intent list is not available,
      // so we get the refund directly via update flow
      return { data: null };
    })();

    // For a complete implementation, we'd look up the refund and associated transaction,
    // call the provider's refund endpoint, then update status.
    // The controller handles the lookup separately.
    throw new AppError('Use processById with the full refund data', 500, 'INTERNAL');
  },

  async approve(refundId: string, intentId: string): Promise<Refund> {
    const intent = await PaymentRepository.findIntent(intentId);
    if (!intent) throw new AppError('Intent not found', 404, 'NOT_FOUND');

    // Find most recent successful transaction for this intent
    const txns = await PaymentRepository.listTransactions(intentId);
    const successTx = txns.find(t => t.status === PaymentStatus.Completed);

    let approved = await PaymentRepository.updateRefund(refundId, { status: RefundStatus.Processing });

    if (successTx && intent.provider) {
      try {
        const adapter = ProviderRegistry.get(intent.provider);
        const result  = await adapter.refund(successTx.providerTxId ?? '', approved.amount, approved.currency);
        if (result.success) {
          approved = await PaymentRepository.updateRefund(refundId, {
            status: RefundStatus.Completed,
            processedAt: new Date().toISOString(),
            ...(result.providerTxId ? { providerRefundId: result.providerTxId } : {}),
          });
          // Update intent status
          await PaymentRepository.updateIntent(intentId, { status: PaymentStatus.Refunded });
        } else {
          approved = await PaymentRepository.updateRefund(refundId, { status: RefundStatus.Failed });
        }
      } catch {
        approved = await PaymentRepository.updateRefund(refundId, { status: RefundStatus.Failed });
      }
    } else {
      // No provider tx — manual refund
      approved = await PaymentRepository.updateRefund(refundId, {
        status: RefundStatus.Completed, processedAt: new Date().toISOString(),
      });
    }
    return approved;
  },
};
