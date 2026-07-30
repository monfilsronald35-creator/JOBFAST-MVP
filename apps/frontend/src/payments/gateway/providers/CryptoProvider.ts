import type { PaymentProviderPlugin, PaymentRequest, PaymentIntent, Transaction, RefundRequest, RefundResult } from '../../types';

// Supported crypto assets and their fiat-equivalent minor unit scale
export const SUPPORTED_CRYPTO = ['BTC', 'ETH', 'USDC', 'USDT', 'SOL', 'MATIC', 'BNB', 'DAI', 'BUSD'] as const;
export type CryptoAsset = typeof SUPPORTED_CRYPTO[number];

export function createCryptoProvider(): PaymentProviderPlugin {
  const api = async <T>(path: string, body?: unknown): Promise<T> => {
    const res = await fetch(`/api/payments/crypto${path}`, {
      method:  body !== undefined ? 'POST' : 'GET',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body:    body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<T>;
  };

  return {
    id:   'crypto',
    name: 'Crypto',
    // Crypto amounts stored in minor units of the fiat equivalent (USD cents)
    supportedMethods:    ['crypto', 'wallet'],
    supportedCurrencies: ['USD', 'EUR', ...SUPPORTED_CRYPTO],
    supportedCountries:  [],    // global — no country restriction
    minAmount:           100,   // $1.00 equivalent
    maxAmount:           999999999,
    feeStructure:        { percentageFee: 1.0, fixedFee: 0 },
    available:           true,

    // Returns a PaymentIntent with a crypto wallet address and expected amount
    charge: (request) => api<PaymentIntent>('/charge', request),

    // Confirm once blockchain transaction is detected (webhook-driven server-side)
    confirm: (intentId) => api<Transaction>(`/confirm/${intentId}`, {}),

    // Crypto is push — capture is a no-op (confirm handles settlement)
    capture: async function(intentId) { return this.confirm(intentId); },

    // Cannot cancel on-chain; mark as expired server-side
    cancel: async (intentId) => { await api(`/expire/${intentId}`, {}); },

    // Crypto refunds are manual — create a refund transaction outbound
    refund: async (request) => {
      const res = await fetch('/api/payments/crypto/refund', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(request),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<RefundResult>;
    },

    getTransaction: (txId) =>
      fetch(`/api/payments/crypto/transactions/${txId}`).then(r => r.ok ? r.json() as Promise<Transaction> : null).catch(() => null),

    health: async () => { try { const r = await fetch('/api/payments/crypto/health'); return r.ok; } catch { return false; } },

    handleWebhook: async (event, signature) => {
      await fetch('/api/payments/crypto/webhook', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(signature ? { 'x-webhook-signature': signature } : {}) },
        body:    JSON.stringify(event),
      });
    },
  };
}
