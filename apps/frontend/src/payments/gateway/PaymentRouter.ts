import type { PaymentProviderId, PaymentMethodType, PaymentRequest, PaymentProviderPlugin } from '../types';

export interface RoutingRule {
  method:    PaymentMethodType;
  countries: string[];   // ISO 3166-1 alpha-2
  currencies: string[];  // ISO 4217
  preferredProviders: PaymentProviderId[];
  fallbackProviders?: PaymentProviderId[];
  minAmount?: number;
  maxAmount?: number;
}

export interface RoutingDecision {
  primary:  PaymentProviderId;
  fallbacks: PaymentProviderId[];
  reason:   string;
}

// Country → default provider ordering
const COUNTRY_ROUTING: Record<string, PaymentProviderId[]> = {
  HT: ['moncash', 'natcash', 'stripe'],
  US: ['stripe', 'ach', 'paypal'],
  BR: ['pix', 'stripe'],
  IN: ['upi', 'stripe'],
  KE: ['mpesa', 'stripe'],
  TZ: ['mpesa', 'stripe'],
  GH: ['mpesa', 'stripe'],
  NG: ['stripe', 'paypal'],
  GB: ['stripe', 'sepa'],
  DE: ['sepa', 'stripe'],
  FR: ['sepa', 'stripe'],
  EU: ['sepa', 'stripe'],
  _default: ['stripe', 'paypal'],
};

// Method → provider capabilities
const METHOD_PROVIDERS: Partial<Record<PaymentMethodType, PaymentProviderId[]>> = {
  card:          ['stripe', 'paypal', 'visa', 'mastercard', 'amex', 'discover'],
  mobile_wallet: ['apple_pay', 'google_pay', 'samsung_pay'],
  mobile_money:  ['moncash', 'natcash', 'mpesa', 'upi'],
  bank_transfer: ['ach', 'sepa', 'swift', 'wise', 'revolut'],
  crypto:        ['crypto'],
  qr:            ['pix', 'upi', 'moncash', 'natcash'],
  nfc:           ['apple_pay', 'google_pay', 'samsung_pay'],
  wallet:        ['stripe', 'paypal'],
  local_bank:    ['local_bank', 'ach', 'sepa', 'swift'],
};

const _customRules: RoutingRule[] = [];

export const PaymentRouter = {
  addRule(rule: RoutingRule): void {
    _customRules.unshift(rule);
  },

  route(request: PaymentRequest, availableProviders: PaymentProviderPlugin[]): RoutingDecision {
    const available = new Set(availableProviders.filter(p => p.available).map(p => p.id));

    // 1. Check custom rules first
    for (const rule of _customRules) {
      if (rule.method !== request.method) continue;
      if (rule.minAmount !== undefined && request.amount < rule.minAmount) continue;
      if (rule.maxAmount !== undefined && request.amount > rule.maxAmount) continue;

      const primary = rule.preferredProviders.find(id => available.has(id));
      if (primary) {
        return {
          primary,
          fallbacks: (rule.fallbackProviders ?? []).filter(id => available.has(id)),
          reason: 'custom_rule',
        };
      }
    }

    // 2. Method-specific providers
    const methodProviders = METHOD_PROVIDERS[request.method] ?? [];
    const methodPrimary   = methodProviders.find(id => available.has(id));

    // 3. Country-specific ordering (from context metadata)
    const country = (request.metadata?.['countryCode'] as string | undefined) ?? '_default';
    const countryOrder = COUNTRY_ROUTING[country] ?? COUNTRY_ROUTING['_default'] ?? [];
    const countryPrimary = countryOrder.find(id => available.has(id) && (methodProviders.length === 0 || methodProviders.includes(id)));

    const primary = countryPrimary ?? methodPrimary ?? (availableProviders[0]?.id);

    if (!primary) {
      return { primary: 'stripe', fallbacks: [], reason: 'no_match_fallback' };
    }

    const fallbacks = [...new Set([...countryOrder, ...methodProviders])]
      .filter(id => id !== primary && available.has(id))
      .slice(0, 3);

    return { primary, fallbacks, reason: countryPrimary ? 'country_optimized' : 'method_match' };
  },

  getCheapestProvider(request: PaymentRequest, providers: PaymentProviderPlugin[]): PaymentProviderId | null {
    const eligible = providers.filter(
      p => p.available
        && p.supportedMethods.includes(request.method)
        && p.supportedCurrencies.includes(request.currency)
        && request.amount >= p.minAmount
        && request.amount <= p.maxAmount,
    );

    if (eligible.length === 0) return null;

    return eligible.reduce((best, p) => {
      const bestFee = best.feeStructure.fixedFee + best.feeStructure.percentageFee * request.amount / 100;
      const thisFee = p.feeStructure.fixedFee   + p.feeStructure.percentageFee   * request.amount / 100;
      return thisFee < bestFee ? p : best;
    }).id;
  },
};