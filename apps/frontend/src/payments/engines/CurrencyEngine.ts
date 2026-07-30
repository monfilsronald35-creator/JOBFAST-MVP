export interface ExchangeRate {
  from:      string;   // ISO 4217
  to:        string;
  rate:      number;   // multiply from-amount by rate to get to-amount
  spread:    number;   // FX fee percentage added on conversion
  fetchedAt: number;
}

export interface ConversionResult {
  fromAmount:  number;  // integer minor units
  fromCurrency: string;
  toAmount:    number;  // integer minor units
  toCurrency:  string;
  rate:        number;
  fxFee:       number;  // in source currency minor units
  rateExpiresAt: number;
}

export interface RegionalPrice {
  country:     string;
  currency:    string;
  amount:      number;   // integer minor units
  displayAmount: string; // formatted for display
}

// In-memory rate cache (30 second TTL)
const _rates = new Map<string, { rate: ExchangeRate; expiresAt: number }>();
const RATE_TTL_MS = 30_000;

export const CurrencyEngine = {
  async getRate(from: string, to: string): Promise<ExchangeRate | null> {
    if (from === to) return { from, to, rate: 1, spread: 0, fetchedAt: Date.now() };

    const cacheKey = `${from}:${to}`;
    const cached   = _rates.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.rate;

    try {
      const res = await fetch(`/api/payments/fx/rates?from=${from}&to=${to}`);
      if (!res.ok) return null;
      const rate = await res.json() as ExchangeRate;
      _rates.set(cacheKey, { rate, expiresAt: Date.now() + RATE_TTL_MS });
      return rate;
    } catch { return null; }
  },

  async getRates(base: string, targets: string[]): Promise<ExchangeRate[]> {
    try {
      const res = await fetch(`/api/payments/fx/rates/bulk?base=${base}&targets=${targets.join(',')}`);
      if (!res.ok) return [];
      const rates = await res.json() as ExchangeRate[];
      rates.forEach(r => _rates.set(`${r.from}:${r.to}`, { rate: r, expiresAt: Date.now() + RATE_TTL_MS }));
      return rates;
    } catch { return []; }
  },

  async convert(amount: number, from: string, to: string): Promise<ConversionResult | null> {
    const rate = await this.getRate(from, to);
    if (!rate) return null;

    const converted = Math.round(amount * rate.rate);
    const fxFee     = Math.round(amount * (rate.spread / 100));

    return {
      fromAmount:    amount,
      fromCurrency:  from,
      toAmount:      converted,
      toCurrency:    to,
      rate:          rate.rate,
      fxFee,
      rateExpiresAt: Date.now() + RATE_TTL_MS,
    };
  },

  async getRegionalPricing(baseAmount: number, baseCurrency: string, countries: string[]): Promise<RegionalPrice[]> {
    try {
      const res = await fetch('/api/payments/fx/regional-pricing', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: baseAmount, currency: baseCurrency, countries }),
      });
      if (res.ok) return res.json() as Promise<RegionalPrice[]>;
    } catch { /* */ }
    return [];
  },

  // Format minor units for display (e.g. 1050 USD → "$10.50")
  format(amount: number, currency: string, locale = 'en-US'): string {
    const minorUnitDivisors: Record<string, number> = {
      JPY: 1, KRW: 1, VND: 1, UGX: 1, HTG: 100,
    };
    const divisor = minorUnitDivisors[currency] ?? 100;
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount / divisor);
  },

  clearCache(): void {
    _rates.clear();
  },
};
