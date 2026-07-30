import { PaymentRepository }         from '../repositories/PaymentRepository.js';
import { RoutingEngine }             from './RoutingEngine.js';
import { FailoverEngine }            from './FailoverEngine.js';
import { RiskVerificationService }   from './RiskVerificationService.js';
import { SplitPaymentService }       from './SplitPaymentService.js';
import { AppError }                  from '../../../core/errors/AppError.js';
import { PaymentStatus }             from '../types/payment.types.js';
import type { CreatePaymentInput, PaymentIntent } from '../types/payment.types.js';

export const PaymentOrchestratorService = {
  async createIntent(userId: string, input: CreatePaymentInput): Promise<PaymentIntent> {
    // 1. Risk & fraud check
    const riskInput: Parameters<typeof RiskVerificationService.verify>[0] = {
      userId, amount: input.amount, currency: input.currency, method: input.method,
    };
    const ri = riskInput as unknown as Record<string, unknown>;
    if (input.ipAddress) ri['ip']       = input.ipAddress;
    if (input.country)   ri['country']  = input.country;
    if (input.deviceId)  ri['deviceId'] = input.deviceId;
    if (input.kycLevel !== undefined) ri['kycLevel'] = input.kycLevel;

    const risk = await RiskVerificationService.verify(riskInput);
    if (!risk.approved) throw new AppError(risk.reason ?? 'Payment rejected by risk engine', 403, 'PAYMENT_REJECTED');

    // 2. Route selection
    const country  = input.country ?? 'US';
    const decision = await RoutingEngine.selectRoute(country, input.currency, input.method);

    // 3. Create intent
    const intentData: Parameters<typeof PaymentRepository.createIntent>[0] = {
      userId, amount: input.amount, currency: input.currency,
      method: input.method, status: PaymentStatus.Pending,
      description: input.description ?? '',
      provider: decision.selectedProvider,
      riskScore: risk.fraudScore,
      requires3DS: risk.require3DS,
      metadata: {
        fraudScore: risk.fraudScore,
        require3DS: risk.require3DS,
        route: decision.reason,
        ...(input.metadata ?? {}),
      },
    };
    const id = intentData as unknown as Record<string, unknown>;
    if (input.splitRuleId) id['splitRuleId'] = input.splitRuleId;
    if (input.escrowId)    id['escrowId']    = input.escrowId;
    if (input.ipAddress)   id['ipAddress']   = input.ipAddress;
    if (input.deviceId)    id['deviceId']    = input.deviceId;
    if (input.country)     id['country']     = input.country;
    if (input.orderId)     id['orderId']     = input.orderId;
    if (input.jobId)       id['jobId']       = input.jobId;

    const intent = await PaymentRepository.createIntent(intentData);

    // 4. If 3DS required, stop here — client must complete 3DS then call confirm
    if (risk.require3DS) return { ...intent, status: PaymentStatus.RequiresAction };

    return intent;
  },

  async confirmIntent(intentId: string, userId: string): Promise<PaymentIntent> {
    const intent = await PaymentRepository.findIntent(intentId);
    if (!intent) throw new AppError('Intent not found', 404, 'NOT_FOUND');
    if (intent.userId !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    if (intent.status !== PaymentStatus.Pending && intent.status !== PaymentStatus.RequiresAction)
      throw new AppError('Intent is not in a confirmable state', 400, 'INVALID_STATE');

    const country  = String(intent.metadata?.['country'] ?? 'US');
    const metadata = intent.metadata ?? {};
    const { success, usedProvider } = await FailoverEngine.execute(
      intentId, intent.amount, intent.currency, intent.method, country, metadata
    );

    const finalStatus = success ? PaymentStatus.Completed : PaymentStatus.Failed;
    const updated = await PaymentRepository.updateIntent(intentId, {
      status: finalStatus, provider: usedProvider,
    });

    if (success && intent.splitRuleId) {
      await SplitPaymentService.execute(intent.splitRuleId, intentId, intent.amount, intent.currency)
        .catch(() => undefined);
    }

    return updated;
  },

  async listIntents(userId: string, opts: { status?: string; limit?: number; cursor?: string } = {}) {
    return PaymentRepository.listIntents(userId, opts.limit, opts.cursor);
  },

  async getIntent(intentId: string, userId: string): Promise<PaymentIntent> {
    const intent = await PaymentRepository.findIntent(intentId);
    if (!intent) throw new AppError('Intent not found', 404, 'NOT_FOUND');
    if (intent.userId !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    return intent;
  },
};
