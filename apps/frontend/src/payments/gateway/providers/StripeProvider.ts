import type { PaymentProviderPlugin, PaymentRequest, PaymentIntent, Transaction, RefundRequest, RefundResult } from '../../types';

// All calls proxy to /api/payments/stripe/* — API keys are server-side only (PCI DSS).
export function createStripeProvider(): PaymentProviderPlugin {
  const api = async <T>(path: string, body?: unknown): Promise<T> => {
    const res = await fetch(`/api/payments/stripe${path}`, {
      method:  body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body:    body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<T>;
  };

  return {
    id:                  'stripe',
    name:                'Stripe',
    supportedMethods:    ['card', 'bank_transfer', 'mobile_wallet', 'wallet', 'buy_now_pay_later'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'DKK', 'NOK', 'HTG'],
    supportedCountries:  ['US', 'GB', 'CA', 'AU', 'FR', 'DE', 'NL', 'BE', 'CH', 'SE', 'DK', 'NO', 'JP', 'HT'],
    minAmount:           50,
    maxAmount:           99999999,
    feeStructure:        { percentageFee: 2.9, fixedFee: 30 },
    available:           true,

    charge:  (request) => api<PaymentIntent>('/payment-intents', request),
    confirm: (intentId, data) => api<Transaction>(`/payment-intents/${intentId}/confirm`, data ?? {}),
    capture: (intentId, amount) => api<Transaction>(`/payment-intents/${intentId}/capture`, { amount }),
    cancel:  async (intentId) => { await api(`/payment-intents/${intentId}/cancel`, {}); },
    refund:  (request) => api<RefundResult>('/refunds', request),
    getTransaction: (id) => fetch(`/api/payments/stripe/charges/${id}`).then(r => r.ok ? r.json() as Promise<Transaction> : null),
    health: async () => { try { const r = await fetch('/api/payments/stripe/health'); return r.ok; } catch { return false; } },
    handleWebhook: async (event, sig) => {
      await fetch('/api/payments/stripe/webhook', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(sig ? { 'stripe-signature': sig } : {}) },
        body:    JSON.stringify(event),
      });
    },
  };
}
