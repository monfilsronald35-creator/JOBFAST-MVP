/**
 * PaymentGateway — Provider Plugin System.
 * No hardcoded payment logic. Each provider is a plugin registered at runtime.
 * Routing selects the best provider for the currency + country + method combination.
 */

import type {
  PaymentProviderPlugin, PaymentProviderId, PaymentMethodConfig,
  CreatePaymentParams, PaymentIntent, TransactionResult, RefundResult,
} from '../types';

// ─── Provider registry ────────────────────────────────────────────────────────

const _providers: Map<PaymentProviderId, PaymentProviderPlugin> = new Map();

export const PaymentGateway = {
  register(plugin: PaymentProviderPlugin): void {
    _providers.set(plugin.id, plugin);
  },

  unregister(id: PaymentProviderId): void {
    _providers.delete(id);
  },

  getProvider(id: PaymentProviderId): PaymentProviderPlugin | null {
    return _providers.get(id) ?? null;
  },

  getAllProviders(): PaymentProviderPlugin[] {
    return Array.from(_providers.values());
  },

  getEnabledProviders(): PaymentProviderPlugin[] {
    return Array.from(_providers.values()).filter(p => p.enabled);
  },

  getAvailableMethods(countryCode: string, currency: string): PaymentMethodConfig[] {
    const methods: PaymentMethodConfig[] = [];
    for (const provider of _providers.values()) {
      if (!provider.enabled) continue;
      const countryOk = provider.countries.length === 0 || provider.countries.includes(countryCode);
      const currOk    = provider.currencies.length === 0 || provider.currencies.includes(currency);
      if (!countryOk || !currOk) continue;
      methods.push(...provider.methods.filter(m => m.enabled));
    }
    return methods;
  },

  resolveProvider(
    providerId:  PaymentProviderId,
    countryCode: string,
    currency:    string,
  ): PaymentProviderPlugin | null {
    const provider = _providers.get(providerId);
    if (!provider?.enabled) return null;
    const countryOk = provider.countries.length === 0 || provider.countries.includes(countryCode);
    const currOk    = provider.currencies.length === 0 || provider.currencies.includes(currency);
    return countryOk && currOk ? provider : null;
  },

  async initAll(): Promise<void> {
    await Promise.all(
      Array.from(_providers.values())
        .filter(p => p.enabled && p.initSDK)
        .map(p => p.initSDK!().catch(err => console.warn(`[PaymentGateway] ${p.id} init failed:`, err))),
    );
  },

  async createPayment(
    providerId: PaymentProviderId,
    params:     CreatePaymentParams,
  ): Promise<PaymentIntent> {
    const provider = _providers.get(providerId);
    if (!provider?.enabled) throw new Error(`Provider ${providerId} not available`);
    return provider.createPayment(params);
  },

  async confirmPayment(
    providerId: PaymentProviderId,
    intentId:   string,
    data?:      unknown,
  ): Promise<TransactionResult> {
    const provider = _providers.get(providerId);
    if (!provider) throw new Error(`Provider ${providerId} not found`);
    return provider.confirmPayment(intentId, data);
  },

  async refund(
    providerId:     PaymentProviderId,
    transactionId:  string,
    amount?:        number,
  ): Promise<RefundResult> {
    const provider = _providers.get(providerId);
    if (!provider) throw new Error(`Provider ${providerId} not found`);
    return provider.refund(transactionId, amount);
  },

  async handleWebhook(providerId: PaymentProviderId, payload: unknown): Promise<void> {
    const provider = _providers.get(providerId);
    if (!provider?.webhook) return;
    await provider.webhook(payload);
  },
};

// ─── Built-in provider stubs (each real impl ships as a separate plugin file) ─

export function createStripePlugin(config: { publishableKey: string }): PaymentProviderPlugin {
  let stripe: unknown = null;
  return {
    id: 'stripe', name: 'Stripe', version: '1.0.0', enabled: true,
    countries: [], currencies: ['USD', 'EUR', 'GBP', 'HTG'],
    config,
    methods: [
      { providerId: 'stripe', methodType: 'card', displayName: 'Card', icon: '💳', enabled: true, countries: [], currencies: ['USD', 'EUR', 'GBP'], feePercent: 2.9, feeFixed: 0.30, feeCurrency: 'USD', metadata: {} },
      { providerId: 'stripe', methodType: 'digital_wallet', displayName: 'Apple Pay', icon: '🍎', enabled: true, countries: ['US', 'GB', 'FR'], currencies: ['USD', 'EUR', 'GBP'], metadata: {} },
      { providerId: 'stripe', methodType: 'digital_wallet', displayName: 'Google Pay', icon: 'G', enabled: true, countries: [], currencies: ['USD', 'EUR', 'GBP'], metadata: {} },
    ],
    async initSDK() {
      // Load Stripe.js lazily when actually needed
    },
    async createPayment(params) {
      const res = await fetch('/api/payments/stripe/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      });
      return res.json() as Promise<PaymentIntent>;
    },
    async confirmPayment(intentId, data) {
      const res = await fetch('/api/payments/stripe/confirm', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ intentId, data }),
      });
      return res.json() as Promise<TransactionResult>;
    },
    async refund(transactionId, amount) {
      const res = await fetch('/api/payments/stripe/refund', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ transactionId, amount }),
      });
      return res.json() as Promise<RefundResult>;
    },
  };
}

export function createMonCashPlugin(config: { clientId: string; mode: 'sandbox' | 'live' }): PaymentProviderPlugin {
  return {
    id: 'moncash', name: 'MonCash', version: '1.0.0', enabled: true,
    countries: ['HT'], currencies: ['HTG', 'USD'],
    config,
    methods: [
      { providerId: 'moncash', methodType: 'mobile_money', displayName: 'MonCash', icon: '📱', enabled: true, countries: ['HT'], currencies: ['HTG', 'USD'], feePercent: 1.5, feeCurrency: 'HTG', metadata: {} },
    ],
    async createPayment(params) {
      const res = await fetch('/api/payments/moncash/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...params, clientId: config.clientId, mode: config.mode }),
      });
      return res.json() as Promise<PaymentIntent>;
    },
    async confirmPayment(intentId) {
      const res = await fetch(`/api/payments/moncash/confirm/${intentId}`, { method: 'GET' });
      return res.json() as Promise<TransactionResult>;
    },
    async refund(transactionId) {
      const res = await fetch('/api/payments/moncash/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });
      return res.json() as Promise<RefundResult>;
    },
  };
}

export function createMpesaPlugin(config: { shortCode: string; mode: 'sandbox' | 'live' }): PaymentProviderPlugin {
  return {
    id: 'mpesa', name: 'M-Pesa', version: '1.0.0', enabled: true,
    countries: ['KE', 'TZ', 'UG', 'GH'], currencies: ['KES', 'TZS', 'UGX', 'GHS'],
    config,
    methods: [
      { providerId: 'mpesa', methodType: 'mobile_money', displayName: 'M-Pesa', icon: '📱', enabled: true, countries: ['KE', 'TZ', 'UG', 'GH'], currencies: ['KES'], feePercent: 1.0, feeCurrency: 'KES', metadata: {} },
    ],
    async createPayment(params) {
      const res = await fetch('/api/payments/mpesa/stk-push', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...params, shortCode: config.shortCode }),
      });
      return res.json() as Promise<PaymentIntent>;
    },
    async confirmPayment(intentId) {
      const res = await fetch(`/api/payments/mpesa/query/${intentId}`);
      return res.json() as Promise<TransactionResult>;
    },
    async refund(transactionId) {
      const res = await fetch('/api/payments/mpesa/refund', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ transactionId }),
      });
      return res.json() as Promise<RefundResult>;
    },
  };
}

export function createWalletPlugin(): PaymentProviderPlugin {
  return {
    id: 'jobfast_wallet', name: 'JOBFAST Wallet', version: '1.0.0', enabled: true,
    countries: [], currencies: ['HTG', 'USD', 'EUR'],
    config: {},
    methods: [
      { providerId: 'jobfast_wallet', methodType: 'wallet', displayName: 'JOBFAST Wallet', icon: '👛', enabled: true, countries: [], currencies: ['HTG', 'USD', 'EUR'], feePercent: 0, metadata: {} },
    ],
    async createPayment(params) {
      const res = await fetch('/api/payments/wallet/pay', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(JSON.parse(localStorage.getItem('jobfast_user') ?? '{}') as { token?: string }).token ?? ''}` },
        body:    JSON.stringify(params),
      });
      return res.json() as Promise<PaymentIntent>;
    },
    async confirmPayment(intentId) {
      const res = await fetch(`/api/payments/wallet/confirm/${intentId}`, {
        headers: { Authorization: `Bearer ${(JSON.parse(localStorage.getItem('jobfast_user') ?? '{}') as { token?: string }).token ?? ''}` },
      });
      return res.json() as Promise<TransactionResult>;
    },
    async refund(transactionId, amount) {
      const res = await fetch('/api/payments/wallet/refund', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(JSON.parse(localStorage.getItem('jobfast_user') ?? '{}') as { token?: string }).token ?? ''}` },
        body:    JSON.stringify({ transactionId, amount }),
      });
      return res.json() as Promise<RefundResult>;
    },
  };
}