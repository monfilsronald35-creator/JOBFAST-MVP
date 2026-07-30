import type {
  PaymentProviderId, PaymentProviderPlugin, PaymentRequest, PaymentResult,
  RefundRequest, RefundResult, Transaction, WebhookEvent, SavedPaymentMethod,
  PaymentIntent,
} from '../types';

type GatewayEvent = 'payment.succeeded' | 'payment.failed' | 'refund.created' | 'chargeback.opened' | 'webhook.received';
type GatewayListener = (data: unknown) => void;

const _providers  = new Map<PaymentProviderId, PaymentProviderPlugin>();
const _listeners  = new Map<GatewayEvent, Set<GatewayListener>>();
const _transactions = new Map<string, Transaction>();

class PaymentGatewayImpl {
  // ─── Provider registry ────────────────────────────────────────────────────

  register(plugin: PaymentProviderPlugin): void {
    _providers.set(plugin.id, plugin);
  }

  getProvider(id: PaymentProviderId): PaymentProviderPlugin | null {
    return _providers.get(id) ?? null;
  }

  getAllProviders(): PaymentProviderPlugin[] {
    return Array.from(_providers.values());
  }

  // ─── Core operations ──────────────────────────────────────────────────────

  async charge(request: PaymentRequest): Promise<PaymentResult> {
    const provider = request.provider
      ? _providers.get(request.provider)
      : await this.resolveProvider(request);

    if (!provider) {
      return { success: false, error: { code: 'no_provider', message: 'No payment provider available for this request.' } };
    }

    try {
      const intent = await provider.charge(request);
      this.emit('payment.succeeded', { intent, provider: provider.id });
      return { success: true, intent, requiresAction: intent.status === 'requires_action', actionUrl: intent.nextAction?.url };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      this.emit('payment.failed', { request, error: message, provider: provider.id });
      return { success: false, error: { code: 'charge_failed', message } };
    }
  }

  async confirm(intentId: string, data?: unknown, providerId?: PaymentProviderId): Promise<PaymentResult> {
    const provider = providerId ? _providers.get(providerId) : this.findProviderForIntent(intentId);
    if (!provider) return { success: false, error: { code: 'no_provider', message: 'Provider not found.' } };

    try {
      const tx = await provider.confirm(intentId, data);
      _transactions.set(tx.id, tx);
      this.emit('payment.succeeded', { transaction: tx });
      return { success: true, transaction: tx };
    } catch (err) {
      return { success: false, error: { code: 'confirm_failed', message: err instanceof Error ? err.message : 'Confirm failed' } };
    }
  }

  async capture(intentId: string, amount?: number, providerId?: PaymentProviderId): Promise<PaymentResult> {
    const provider = providerId ? _providers.get(providerId) : this.findProviderForIntent(intentId);
    if (!provider) return { success: false, error: { code: 'no_provider', message: 'Provider not found.' } };

    try {
      const tx = await provider.capture(intentId, amount);
      _transactions.set(tx.id, tx);
      return { success: true, transaction: tx };
    } catch (err) {
      return { success: false, error: { code: 'capture_failed', message: err instanceof Error ? err.message : 'Capture failed' } };
    }
  }

  async cancel(intentId: string, providerId?: PaymentProviderId): Promise<{ success: boolean; error?: string }> {
    const provider = providerId ? _providers.get(providerId) : this.findProviderForIntent(intentId);
    if (!provider) return { success: false, error: 'Provider not found.' };

    try {
      await provider.cancel(intentId);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Cancel failed' };
    }
  }

  async refund(request: RefundRequest, providerId?: PaymentProviderId): Promise<RefundResult> {
    const tx      = _transactions.get(request.transactionId);
    const pid     = providerId ?? (tx?.provider);
    const provider = pid ? _providers.get(pid) : null;

    if (!provider) return { success: false, amount: 0, currency: 'USD', status: 'failed', createdAt: Date.now() };

    try {
      const result = await provider.refund(request);
      this.emit('refund.created', { refund: result, transactionId: request.transactionId });
      return result;
    } catch (err) {
      return { success: false, amount: 0, currency: 'USD', status: 'failed', createdAt: Date.now() };
    }
  }

  async getTransaction(id: string, providerId?: PaymentProviderId): Promise<Transaction | null> {
    const cached = _transactions.get(id);
    if (cached) return cached;

    if (providerId) {
      const provider = _providers.get(providerId);
      const tx = await provider?.getTransaction(id) ?? null;
      if (tx) _transactions.set(tx.id, tx);
      return tx;
    }

    // Query backend
    try {
      const res = await fetch(`/api/payments/transactions/${id}`);
      if (!res.ok) return null;
      const tx = await res.json() as Transaction;
      _transactions.set(tx.id, tx);
      return tx;
    } catch { return null; }
  }

  async getSavedMethods(customerId: string): Promise<SavedPaymentMethod[]> {
    try {
      const res = await fetch(`/api/payments/customers/${customerId}/methods`);
      if (res.ok) return res.json() as Promise<SavedPaymentMethod[]>;
    } catch { /* */ }
    return [];
  }

  async deleteSavedMethod(methodId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/payments/methods/${methodId}`, { method: 'DELETE' });
      return res.ok;
    } catch { return false; }
  }

  async processWebhook(event: WebhookEvent): Promise<void> {
    const provider = _providers.get(event.provider);
    await provider?.handleWebhook?.(event.data, event.signature);
    this.emit('webhook.received', event);
  }

  async healthCheck(): Promise<Map<PaymentProviderId, boolean>> {
    const results = new Map<PaymentProviderId, boolean>();
    await Promise.all(
      Array.from(_providers.entries()).map(async ([id, p]) => {
        const ok = await p.health().catch(() => false);
        results.set(id, ok);
      }),
    );
    return results;
  }

  // ─── Event bus ────────────────────────────────────────────────────────────

  on(event: GatewayEvent, listener: GatewayListener): () => void {
    if (!_listeners.has(event)) _listeners.set(event, new Set());
    _listeners.get(event)!.add(listener);
    return () => _listeners.get(event)?.delete(listener);
  }

  private emit(event: GatewayEvent, data: unknown): void {
    _listeners.get(event)?.forEach(fn => { try { fn(data); } catch { /* */ } });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async resolveProvider(request: PaymentRequest): Promise<PaymentProviderPlugin | null> {
    // Delegate to backend router for optimal provider selection
    try {
      const res = await fetch('/api/payments/route', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ method: request.method, currency: request.currency, amount: request.amount }),
      });
      if (res.ok) {
        const { providerId } = await res.json() as { providerId: PaymentProviderId };
        return _providers.get(providerId) ?? null;
      }
    } catch { /* */ }

    // Client-side fallback: first available provider that supports the method
    return Array.from(_providers.values()).find(
      p => p.available && p.supportedMethods.includes(request.method) && p.supportedCurrencies.includes(request.currency),
    ) ?? null;
  }

  private findProviderForIntent(intentId: string): PaymentProviderPlugin | null {
    // intentId prefixes: pi_ = stripe, PP- = paypal, MC- = moncash, etc.
    if (intentId.startsWith('pi_'))   return _providers.get('stripe')   ?? null;
    if (intentId.startsWith('PP-'))   return _providers.get('paypal')   ?? null;
    if (intentId.startsWith('MC-'))   return _providers.get('moncash')  ?? null;
    return null;
  }
}

export const PaymentGateway = new PaymentGatewayImpl();