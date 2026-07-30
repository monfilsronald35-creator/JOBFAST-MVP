import type { PaymentProviderPlugin, PaymentProviderId, PaymentRequest, PaymentIntent, Transaction, RefundRequest, RefundResult } from '../../types';

interface BankConfig {
  id:          PaymentProviderId;
  name:        string;
  currencies:  string[];
  countries:   string[];
  fee:         { percentageFee: number; fixedFee: number };
  maxAmount:   number;
}

const BANK_CONFIGS: BankConfig[] = [
  {
    id: 'sepa', name: 'SEPA',
    currencies: ['EUR'], countries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'FI', 'GR', 'IE', 'LU'],
    fee: { percentageFee: 0.2, fixedFee: 20 }, maxAmount: 100000000,
  },
  {
    id: 'ach', name: 'ACH',
    currencies: ['USD'], countries: ['US'],
    fee: { percentageFee: 0.8, fixedFee: 0 }, maxAmount: 100000000,
  },
  {
    id: 'swift', name: 'SWIFT Wire',
    currencies: ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'HKD', 'SGD', 'HTG'],
    countries: ['US', 'GB', 'EU', 'CH', 'JP', 'CA', 'AU', 'HK', 'SG', 'HT'],
    fee: { percentageFee: 0.5, fixedFee: 2500 }, maxAmount: 999999999,
  },
];

function makeBankProvider(cfg: BankConfig): PaymentProviderPlugin {
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
    supportedMethods:    ['bank_transfer'],
    supportedCurrencies: cfg.currencies,
    supportedCountries:  cfg.countries,
    minAmount:           id === 'swift' ? 10000 : 100,
    maxAmount:           cfg.maxAmount,
    feeStructure:        cfg.fee,
    available:           true,

    charge:  (request) => api<PaymentIntent>('/initiate', request),
    confirm: (intentId) => api<Transaction>(`/confirm/${intentId}`, {}),
    capture: async function(intentId) { return this.confirm(intentId); },
    cancel:  async (intentId) => { await api(`/cancel/${intentId}`, {}); },
    refund:  (request) => api<RefundResult>('/refund', request),
    getTransaction: (txId) =>
      fetch(`/api/payments/${id}/transactions/${txId}`).then(r => r.ok ? r.json() as Promise<Transaction> : null).catch(() => null),
    health: async () => { try { const r = await fetch(`/api/payments/${id}/health`); return r.ok; } catch { return false; } },
  };
}

export const createSEPAProvider  = () => makeBankProvider(BANK_CONFIGS[0]!);
export const createACHProvider   = () => makeBankProvider(BANK_CONFIGS[1]!);
export const createSWIFTProvider = () => makeBankProvider(BANK_CONFIGS[2]!);

// Extensible local bank adapter
export function createLocalBankProvider(bankId: string, bankName: string, currencies: string[], countries: string[]): PaymentProviderPlugin {
  return makeBankProvider({
    id: 'local_bank' as PaymentProviderId,
    name: bankName,
    currencies,
    countries,
    fee: { percentageFee: 1.0, fixedFee: 0 },
    maxAmount: 99999999,
  });
}
