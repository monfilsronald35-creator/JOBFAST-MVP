// ─── Country Configuration Types ─────────────────────────────────────────────

export interface CurrencyConfig {
  code:         string;
  symbol:       string;
  name:         string;
  decimals:     number;
  symbolBefore: boolean;
  thousands:    string;
  decimal:      string;
}

export interface TaxRule {
  id:          string;
  name:        string;
  rate:        number;
  type:        'vat' | 'gst' | 'sales_tax' | 'custom';
  inclusive:   boolean;
  categories?: string[];
  regions?:    string[];
}

export interface AddressFormat {
  fields:   AddressField[];
  template: string;
}

export interface AddressField {
  key:       string;
  label:     string;
  required:  boolean;
  type:      'text' | 'select' | 'postal';
  options?:  string[];
}

export interface PhoneFormat {
  countryCode:  string;
  placeholder:  string;
  pattern:      string;
  minLength:    number;
  maxLength:    number;
}

export interface LegalRule {
  key:     string;
  label:   string;
  value:   string;
  link?:   string;
}

export interface CountryConfig {
  code:              string;
  name:              string;
  nativeName:        string;
  flag:              string;
  defaultCurrency:   string;
  currencies:        CurrencyConfig[];
  defaultLanguage:   string;
  languages:         string[];
  timezone:          string;
  timezones:         string[];
  phoneFormat:       PhoneFormat;
  addressFormat:     AddressFormat;
  taxRules:          TaxRule[];
  vatRate?:          number;
  enabledPayments:   string[];
  localPaymentProviders: string[];
  legalRules:        LegalRule[];
  dateFormat:        string;
  timeFormat:        '12h' | '24h';
  weekStart:         0 | 1;
  numberFormat:      { thousands: string; decimal: string };
  isActive:          boolean;
  metadata:          Record<string, unknown>;
}

export const COUNTRY_DEFAULTS: Record<string, Partial<CountryConfig>> = {
  HT: {
    code: 'HT',
    name: 'Haiti',
    nativeName: 'Ayiti',
    flag: '🇭🇹',
    defaultCurrency: 'HTG',
    defaultLanguage: 'ht',
    languages: ['ht', 'fr'],
    timezone: 'America/Port-au-Prince',
    timezones: ['America/Port-au-Prince'],
    phoneFormat: { countryCode: '+509', placeholder: '+509 XXXX XXXX', pattern: '^\\+509\\d{8}$', minLength: 8, maxLength: 8 },
    enabledPayments: ['moncash', 'natcash', 'jobfast_wallet', 'cash_on_delivery', 'bank_transfer'],
    localPaymentProviders: ['moncash', 'natcash'],
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    weekStart: 1,
    numberFormat: { thousands: ',', decimal: '.' },
  },
  US: {
    code: 'US',
    name: 'United States',
    nativeName: 'United States',
    flag: '🇺🇸',
    defaultCurrency: 'USD',
    defaultLanguage: 'en',
    languages: ['en', 'es'],
    timezone: 'America/New_York',
    enabledPayments: ['stripe', 'paypal', 'apple_pay', 'google_pay', 'jobfast_wallet', 'bank_transfer'],
    localPaymentProviders: ['stripe', 'paypal'],
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    weekStart: 0,
    numberFormat: { thousands: ',', decimal: '.' },
  },
  KE: {
    code: 'KE',
    name: 'Kenya',
    nativeName: 'Kenya',
    flag: '🇰🇪',
    defaultCurrency: 'KES',
    defaultLanguage: 'sw',
    languages: ['sw', 'en'],
    timezone: 'Africa/Nairobi',
    enabledPayments: ['mpesa', 'stripe', 'jobfast_wallet', 'cash_on_delivery'],
    localPaymentProviders: ['mpesa'],
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    weekStart: 1,
    numberFormat: { thousands: ',', decimal: '.' },
  },
  FR: {
    code: 'FR',
    name: 'France',
    nativeName: 'France',
    flag: '🇫🇷',
    defaultCurrency: 'EUR',
    defaultLanguage: 'fr',
    languages: ['fr'],
    timezone: 'Europe/Paris',
    enabledPayments: ['stripe', 'paypal', 'apple_pay', 'google_pay', 'adyen', 'jobfast_wallet'],
    localPaymentProviders: ['stripe', 'adyen'],
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    weekStart: 1,
    numberFormat: { thousands: ' ', decimal: ',' },
  },
};