import type { PaymentRequest, PaymentResult, PaymentProviderId } from '../types';
import { PaymentGateway } from './PaymentGateway';
import { PaymentRouter } from './PaymentRouter';

export interface OrchestratorOptions {
  maxRetries?:     number;
  retryDelayMs?:   number;
  fallbackOnFail?: boolean;
  idempotencyKey?: string;
}

const NON_RETRYABLE = new Set(['card_declined', 'insufficient_funds', 'expired_card', 'do_not_honor', 'blocked']);

function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

class PaymentOrchestratorImpl {
  private readonly _inflight = new Map<string, Promise<PaymentResult>>();

  async charge(request: PaymentRequest, options: OrchestratorOptions = {}): Promise<PaymentResult> {
    const { maxRetries = 3, retryDelayMs = 500, fallbackOnFail = true, idempotencyKey } = options;

    if (idempotencyKey && this._inflight.has(idempotencyKey)) {
      return this._inflight.get(idempotencyKey)!;
    }

    const work = this._executeWithFallback(request, maxRetries, retryDelayMs, fallbackOnFail);

    if (idempotencyKey) {
      this._inflight.set(idempotencyKey, work);
      work.finally(() => this._inflight.delete(idempotencyKey));
    }

    return work;
  }

  async authorizeAndCapture(request: PaymentRequest, captureDelayMs = 0): Promise<PaymentResult> {
    const auth = await this.charge({ ...request, capture: 'manual' });
    if (!auth.success || !auth.intent) return auth;
    if (captureDelayMs > 0) await sleep(captureDelayMs);
    return PaymentGateway.capture(auth.intent.id, request.amount, request.provider);
  }

  async schedulePayment(request: PaymentRequest, scheduledAt: number): Promise<{ jobId: string }> {
    const res = await fetch('/api/payments/scheduled', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ request, scheduledAt }),
    });
    if (!res.ok) throw new Error('Failed to schedule payment');
    return res.json() as Promise<{ jobId: string }>;
  }

  async cancelScheduled(jobId: string): Promise<boolean> {
    const res = await fetch(`/api/payments/scheduled/${jobId}`, { method: 'DELETE' });
    return res.ok;
  }

  private async _executeWithFallback(
    request:        PaymentRequest,
    maxRetries:     number,
    retryDelayMs:   number,
    fallbackOnFail: boolean,
  ): Promise<PaymentResult> {
    const providers = PaymentGateway.getAllProviders();
    const decision  = PaymentRouter.route(request, providers);
    const chain     = [decision.primary, ...(fallbackOnFail ? decision.fallbacks : [])];
    let lastError: string | undefined;

    for (const providerId of chain) {
      const result = await this._retryCharge(
        { ...request, provider: providerId as PaymentProviderId },
        maxRetries, retryDelayMs,
      );
      if (result.success) return result;
      lastError = result.error?.message;
    }

    return { success: false, error: { code: 'all_providers_failed', message: lastError ?? 'All payment providers failed.' } };
  }

  private async _retryCharge(request: PaymentRequest, maxRetries: number, delayMs: number): Promise<PaymentResult> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await PaymentGateway.charge(request);
      if (result.success) return result;
      if (NON_RETRYABLE.has(result.error?.code ?? '')) return result;
      if (attempt < maxRetries) await sleep(delayMs * Math.pow(2, attempt));
    }
    return { success: false, error: { code: 'max_retries_exceeded', message: 'Max retries exceeded.' } };
  }
}

export const PaymentOrchestrator = new PaymentOrchestratorImpl();
