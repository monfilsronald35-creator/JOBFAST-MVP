import type { PaymentRequest, PaymentResult, WebhookEvent, PaymentProviderId } from '../types';
import { PaymentGateway } from '../gateway/PaymentGateway';
import { PaymentOrchestrator } from '../gateway/PaymentOrchestrator';
import { CurrencyEngine } from '../engines/CurrencyEngine';

export interface SDKConfig {
  environment: 'sandbox' | 'production';
  partnerId:   string;
  version?:    string;
}

export interface CheckoutSession {
  sessionId:    string;
  amount:       number;    // integer minor units
  currency:     string;
  returnUrl:    string;
  cancelUrl?:   string;
  expiresAt:    number;
  checkoutUrl:  string;
}

export interface WebhookVerification {
  valid:     boolean;
  eventType: string;
  provider:  PaymentProviderId;
}

class PaymentSDKImpl {
  private config: SDKConfig = { environment: 'sandbox', partnerId: '' };

  init(config: SDKConfig): void {
    this.config = config;
  }

  get isSandbox(): boolean {
    return this.config.environment === 'sandbox';
  }

  // ─── Checkout ────────────────────────────────────────────────────────────

  async createCheckoutSession(params: {
    amount:       number;
    currency:     string;
    returnUrl:    string;
    cancelUrl?:   string;
    metadata?:    Record<string, unknown>;
  }): Promise<CheckoutSession> {
    const res = await fetch('/api/payments/sdk/checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-partner-id': this.config.partnerId },
      body:    JSON.stringify({ ...params, environment: this.config.environment }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<CheckoutSession>;
  }

  async charge(request: PaymentRequest): Promise<PaymentResult> {
    return PaymentOrchestrator.charge(request, { idempotencyKey: request.idempotencyKey });
  }

  // ─── Webhooks ────────────────────────────────────────────────────────────

  async verifyWebhook(payload: string, signature: string, provider: PaymentProviderId): Promise<WebhookVerification> {
    const res = await fetch('/api/payments/sdk/webhooks/verify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ payload, signature, provider }),
    });
    if (!res.ok) return { valid: false, eventType: 'unknown', provider };
    return res.json() as Promise<WebhookVerification>;
  }

  onWebhookEvent(provider: PaymentProviderId, eventType: string, handler: (event: WebhookEvent) => void): () => void {
    return PaymentGateway.on('webhook.received', (data) => {
      const event = data as WebhookEvent;
      if (event.provider === provider && (eventType === '*' || event.type === eventType)) {
        handler(event);
      }
    });
  }

  // ─── Currency ────────────────────────────────────────────────────────────

  formatAmount(amount: number, currency: string, locale?: string): string {
    return CurrencyEngine.format(amount, currency, locale);
  }

  async convertAmount(amount: number, from: string, to: string): Promise<number | null> {
    const result = await CurrencyEngine.convert(amount, from, to);
    return result?.toAmount ?? null;
  }

  // ─── API Keys ────────────────────────────────────────────────────────────

  async createAPIKey(label: string, permissions: string[]): Promise<{ key: string; id: string; createdAt: number }> {
    const res = await fetch('/api/payments/sdk/api-keys', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-partner-id': this.config.partnerId },
      body:    JSON.stringify({ label, permissions }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{ key: string; id: string; createdAt: number }>;
  }

  async revokeAPIKey(keyId: string): Promise<boolean> {
    const res = await fetch(`/api/payments/sdk/api-keys/${keyId}`, {
      method:  'DELETE',
      headers: { 'x-partner-id': this.config.partnerId },
    });
    return res.ok;
  }

  // ─── Sandbox utilities ───────────────────────────────────────────────────

  async sandbox_triggerWebhook(provider: PaymentProviderId, eventType: string, data?: unknown): Promise<void> {
    if (!this.isSandbox) throw new Error('Only available in sandbox environment');
    await fetch('/api/payments/sdk/sandbox/trigger', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ provider, eventType, data }),
    });
  }

  async sandbox_reset(): Promise<void> {
    if (!this.isSandbox) throw new Error('Only available in sandbox environment');
    await fetch('/api/payments/sdk/sandbox/reset', { method: 'POST' });
  }
}

export const PaymentSDK = new PaymentSDKImpl();
