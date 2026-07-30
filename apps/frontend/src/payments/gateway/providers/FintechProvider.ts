import type { PaymentProviderPlugin, PaymentProviderId, PaymentRequest, PaymentIntent, Transaction, RefundRequest, RefundResult } from '../../types';

interface FintechConfig {
  id:         PaymentProviderId;
  name:       string;
  currencies: string[];
  countries:  string[];
  fee:        { percentageFee: number; fixedFee: number };
  methods:    PaymentProviderPlugin['supportedMethods'];
  maxAmount:  number;
}

const FINTECH: FintechConfig[] = [
  {
    id: 'paypal', name: 'PayPal',
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'MXN', 'BRL', 'CHF'],
    countries:  ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'MX', 'BR', 'JP'],
    fee:        { percentageFee: 3.49, fixedFee: 49 },
    methods:    ['wallet', 'bank_transfer', 'card', 'buy_now_pay_later'],
    maxAmount:  1000000,
  },
  {
    id: 'wise', name: 'Wise',
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'HTG', 'BRL', 'INR', 'KES', 'CHF', 'SEK', 'DKK'],
    countries:  ['US', 'GB', 'EU', 'CA', 'AU', 'HT', 'BR', 'IN', 'KE', 'SG', 'HK', 'ZA'],
    fee:        { percentageFee: 0.5, fixedFee: 0 },
    methods:    ['bank_transfer'],
    maxAmount:  50000000,
  },
  {
    id: 'revolut', name: 'Revolut',
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'SEK', 'DKK', 'NOK', 'JPY', 'SGD'],
    countries:  ['GB', 'EU', 'US', 'CA', 'AU', 'JP', 'SG'],
    fee:        { percentageFee: 1.0, fixedFee: 0 },
    methods:    ['bank_transfer', 'card', 'wallet'],
    maxAmount:  2000000,
  },
];

function makeFintechProvider(cfg: FintechConfig): PaymentProviderPlugin {
  const { id } = cfg;
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
    name:                cfg.name,
    supportedMethods:    cfg.methods,
    supportedCurrencies: cfg.currencies,
    supportedCountries:  cfg.countries,
    minAmount:           1,
    maxAmount:           cfg.maxAmount,
    feeStructure:        cfg.fee,
    available:           true,

    charge:  (request) => api<PaymentIntent>('/charge', request),
    confirm: (intentId, data) => api<Transaction>(`/confirm/${intentId}`, data ?? {}),
    capture: async function(intentId) { return this.confirm(intentId); },
    cancel:  async (intentId) => { await api(`/cancel/${intentId}`, {}); },
    refund:  (request) => api<RefundResult>('/refund', request),
    getTransaction: (txId) =>
      fetch(`/api/payments/${id}/transactions/${txId}`).then(r => r.ok ? r.json() as Promise<Transaction> : null).catch(() => null),
    health: async () => { try { const r = await fetch(`/api/payments/${id}/health`); return r.ok; } catch { return false; } },
  };
}

export const createPayPalProvider  = () => makeFintechProvider(FINTECH[0]!);
export const createWiseProvider    = () => makeFintechProvider(FINTECH[1]!);
export const createRevolutProvider = () => makeFintechProvider(FINTECH[2]!);
