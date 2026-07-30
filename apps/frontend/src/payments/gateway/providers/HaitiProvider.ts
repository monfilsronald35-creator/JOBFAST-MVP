import type { PaymentProviderPlugin, PaymentRequest, PaymentIntent, Transaction, RefundRequest, RefundResult } from '../../types';

function makeHaitiProvider(id: 'moncash' | 'natcash', name: string): PaymentProviderPlugin {
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
    supportedMethods:    ['mobile_money', 'qr', 'wallet'],
    supportedCurrencies: ['HTG', 'USD'],
    supportedCountries:  ['HT'],
    minAmount:           100,    // 1 HTG
    maxAmount:           500000, // 5,000 HTG
    feeStructure:        { percentageFee: 2.5, fixedFee: 0 },
    available:           true,

    charge:  (request) => api<PaymentIntent>('/charge', request),
    confirm: (intentId) => api<Transaction>(`/confirm/${intentId}`, {}),
    capture: async function(intentId) { return this.confirm(intentId); },
    cancel:  async (intentId) => { await api(`/cancel/${intentId}`, {}); },
    refund:  (request) => api<RefundResult>('/refund', request),
    getTransaction: (txId) =>
      fetch(`/api/payments/${id}/transactions/${txId}`).then(r => r.ok ? r.json() as Promise<Transaction> : null).catch(() => null),
    health: async () => { try { const r = await fetch(`/api/payments/${id}/health`); return r.ok; } catch { return false; } },
  };
}

export const createMonCashProvider = () => makeHaitiProvider('moncash', 'MonCash');
export const createNatCashProvider = () => makeHaitiProvider('natcash', 'NatCash');
