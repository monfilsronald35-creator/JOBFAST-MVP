import type { PaymentProviderPlugin, PaymentRequest, PaymentIntent, Transaction, RefundRequest, RefundResult } from '../../types';

type WalletId = 'apple_pay' | 'google_pay' | 'samsung_pay';

function isAvailable(id: WalletId): boolean {
  if (typeof window === 'undefined') return false;
  if (id === 'apple_pay')   return !!(window as Record<string, unknown>)['ApplePaySession'];
  if (id === 'google_pay')  return !!((window as Record<string, unknown>)['google'] as Record<string, unknown> | undefined)?.['payments'];
  if (id === 'samsung_pay') return !!((navigator as unknown as Record<string, unknown>))['samsungPay'];
  return false;
}

function makeWalletProvider(id: WalletId, name: string): PaymentProviderPlugin {
  const api = async <T>(path: string, body?: unknown): Promise<T> => {
    const res = await fetch(`/api/payments/${id}${path}`, {
      method:  body !== undefined ? 'POST' : 'GET',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body:    body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<T>;
  };

  return {
    id,
    name,
    supportedMethods:    ['mobile_wallet', 'nfc', 'qr'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'HTG', 'KRW', 'SGD', 'HKD'],
    supportedCountries:  ['US', 'GB', 'CA', 'AU', 'FR', 'DE', 'JP', 'KR', 'SG', 'HK'],
    minAmount:           1,
    maxAmount:           99999999,
    feeStructure:        { percentageFee: 2.9, fixedFee: 30 },
    available:           isAvailable(id),

    charge:  (request) => api<PaymentIntent>('/charge', request),
    confirm: (intentId, data) => api<Transaction>(`/confirm/${intentId}`, data ?? {}),
    capture: (intentId, amount) => api<Transaction>(`/capture/${intentId}`, { amount }),
    cancel:  async (intentId) => { await api(`/cancel/${intentId}`, {}); },
    refund:  (request) => api<RefundResult>('/refund', request),
    getTransaction: (txId) =>
      fetch(`/api/payments/${id}/transactions/${txId}`).then(r => r.ok ? r.json() as Promise<Transaction> : null).catch(() => null),
    health: async () => { if (!isAvailable(id)) return false; try { const r = await fetch(`/api/payments/${id}/health`); return r.ok; } catch { return false; } },
  };
}

export const createApplePayProvider   = () => makeWalletProvider('apple_pay',   'Apple Pay');
export const createGooglePayProvider  = () => makeWalletProvider('google_pay',  'Google Pay');
export const createSamsungPayProvider = () => makeWalletProvider('samsung_pay', 'Samsung Pay');
