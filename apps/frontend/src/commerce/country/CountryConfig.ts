/**
 * CountryConfig — Runtime country registry extending COUNTRY_DEFAULTS.
 * Supports registering new countries and overriding defaults at runtime.
 */

import type { CountryConfig } from '../types';
import { COUNTRY_DEFAULTS } from '../types';

const _registry = new Map<string, CountryConfig>(
  Object.entries(COUNTRY_DEFAULTS)
    .filter(([, v]) => (v as Partial<CountryConfig>).code !== undefined)
    .map(([k, v]) => [k, v as CountryConfig]),
);

export const CountryConfigRegistry = {
  register(config: CountryConfig): void {
    _registry.set(config.code.toUpperCase(), config);
  },

  get(code: string): CountryConfig | null {
    return _registry.get(code.toUpperCase()) ?? null;
  },

  getOrDefault(code: string): CountryConfig {
    const found = _registry.get(code.toUpperCase());
    if (found) return found;
    return {
      code:             code.toUpperCase(),
      name:             code,
      nativeName:       code,
      flag:             '🌍',
      defaultCurrency:  'USD',
      currencies:       [],
      defaultLanguage:  'en',
      languages:        ['en'],
      timezone:         'UTC',
      timezones:        ['UTC'],
      phoneFormat:      { countryCode: '+1', placeholder: '+1XXXXXXXXXX', pattern: '^\\+1\\d{10}$', minLength: 10, maxLength: 10 },
      addressFormat:    { fields: [], template: '{line1}, {city}' },
      taxRules:         [],
      enabledPayments:  ['stripe'],
      localPaymentProviders: [],
      legalRules:       [],
      dateFormat:       'MM/DD/YYYY',
      timeFormat:       '12h',
      weekStart:        0,
      numberFormat:     { thousands: ',', decimal: '.' },
      isActive:         true,
      metadata:         {},
    };
  },

  getAll(): CountryConfig[] {
    return Array.from(_registry.values());
  },

  getSupportedCountries(): string[] {
    return Array.from(_registry.keys());
  },

  supportsProvider(countryCode: string, providerId: string): boolean {
    const cfg = this.get(countryCode);
    return cfg?.enabledPayments.includes(providerId) ?? false;
  },

  getCurrency(countryCode: string): string {
    return this.getOrDefault(countryCode).defaultCurrency;
  },

  formatPhone(countryCode: string, localNumber: string): string {
    const cfg = this.get(countryCode);
    if (!cfg) return localNumber;
    return `${cfg.phoneFormat.countryCode}${localNumber.replace(/\D/g, '')}`;
  },

  getTaxRate(countryCode: string): number {
    const cfg = this.get(countryCode);
    if (!cfg) return 0;
    const mainRule = cfg.taxRules[0];
    return mainRule?.rate ?? 0;
  },
};