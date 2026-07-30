import type { PaymentProviderPlugin, PaymentProviderId, PaymentRequest, PaymentIntent, Transaction, RefundRequest, RefundResult } from '../../types';

interface RegionalConfig {
  id:          PaymentProviderId;
  name:        string;
  currencies:  string[];
  countries:   string[];
  methods:     PaymentProviderPlugin['supportedMethods'];
  minAmount:   number;
  maxAmount:   number;
  fee:         { percentageFee: number; fixedFee: number };
}

const CONFIGS: RegionalConfig[] = [
  {
    id: 'pix', name: 'PIX', currencies: ['BRL'], countries: ['BR'],
    methods: ['bank_transfer', 'qr'], minAmount: 1, maxAmount: 9999999999,
    fee: { percentageFee: 0, fixedFee: 0 },
  },
  {
    id: 'upi', name: 'UPI', currencies: ['INR'], countries: ['IN'],
    methods: ['mobile_money', 'qr', 'bank_transfer'], minAmount: 1, maxAmount: 10000000,
    fee: { percentageFee: 0, fixedFee: 0 },
  },
  {
    id: 'mpesa', name: 'M-Pesa', currencies: ['KES', 'TZS', 'GHS', 'NGN'], countries: ['KE', 'TZ', 'GH', 'NG', 'MZ'],
    methods: ['mobile_money', 'qr'], minAmount: 100, maxAmount: 15000000,
    fee: { percentageFee: 1.5, fixedFee: 0 },
  },
];

function makeRegionalProvider(cfg: RegionalConfig): PaymentProviderPlugin {
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
    minAmount:           cfg.minAmount,
    maxAmount:           cfg.maxAmount,
    feeStructure:        cfg.fee,
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

export const createPIXProvider   = () => makeRegionalProvider(CONFIGS[0]!);
export const createUPIProvider   = () => makeRegionalProvider(CONFIGS[1]!);
export const createMpesaProvider = () => makeRegionalProvider(CONFIGS[2]!);
