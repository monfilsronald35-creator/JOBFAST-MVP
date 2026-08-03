/**
 * LocalizationService — formats dates, currencies, phone numbers, and addresses
 * according to the active CountryContext.
 */
import type { CountryConfig } from '../types/localization.types.js';

export const LocalizationService = {
  /**
   * Format a currency amount for display.
   * amount is always in minor units (centimes, cents, etc.)
   */
  formatCurrency(amountMinorUnits: number, config: CountryConfig): string {
    const major    = amountMinorUnits / 100;
    const { decimalSeparator, thousandSeparator, currencyPosition } = config.numberFormat;

    const formatted = major
      .toFixed(2)
      .replace('.', '§')                       // temp placeholder
      .replace(/\B(?=(\d{3})+(?!\d))/g, '‡')  // mark thousands
      .replace('§', decimalSeparator)
      .replace(/‡/g, thousandSeparator);

    return currencyPosition === 'before'
      ? `${config.currency} ${formatted}`
      : `${formatted} ${config.currency}`;
  },

  /**
   * Format a Date object per country's date format.
   * Supports: DD/MM/YYYY, MM/DD/YYYY, DD.MM.YYYY, YYYY-MM-DD
   */
  formatDate(date: Date, config: CountryConfig): string {
    const d  = String(date.getDate()).padStart(2, '0');
    const m  = String(date.getMonth() + 1).padStart(2, '0');
    const y  = date.getFullYear();
    const fmt = config.dateFormat;

    return fmt
      .replace('DD', d)
      .replace('MM', m)
      .replace('YYYY', String(y));
  },

  /**
   * Format time per country's time format (12h vs 24h).
   */
  formatTime(date: Date, config: CountryConfig): string {
    if (config.timeFormat === '24h') {
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
    const h   = date.getHours();
    const m   = String(date.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  },

  /**
   * Format a number with country-specific decimal/thousand separators.
   */
  formatNumber(n: number, config: CountryConfig, decimals = 0): string {
    const { decimalSeparator, thousandSeparator } = config.numberFormat;
    return n
      .toFixed(decimals)
      .replace('.', '§')
      .replace(/\B(?=(\d{3})+(?!\d))/g, '‡')
      .replace('§', decimalSeparator)
      .replace(/‡/g, thousandSeparator);
  },

  /**
   * Format a phone number with the country's calling code.
   */
  formatPhone(raw: string, config: CountryConfig): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('00') || digits.startsWith(config.callingCode.replace('+', ''))) {
      return `+${digits.replace(/^0+/, '')}`;
    }
    const cleaned = config.callingCode.replace('+', '');
    return `+${cleaned}${digits}`;
  },

  /**
   * Get a human-readable format example for a given country.
   * Used by the "Format Preview" endpoint.
   */
  getFormatExamples(config: CountryConfig): Record<string, string> {
    const now = new Date('2026-08-15T14:30:00Z');
    return {
      currency:   this.formatCurrency(150050, config),  // 1,500.50 in minor units
      date:       this.formatDate(now, config),
      time:       this.formatTime(now, config),
      number:     this.formatNumber(1234567.89, config, 2),
      phone:      this.formatPhone('509 12345678', config),
      currency_code: config.currency,
      date_format:   config.dateFormat,
      time_format:   config.timeFormat,
      language:      config.primaryLanguage,
    };
  },

  /**
   * Get the IANA time zone identifier for a country.
   */
  getTimeZone(config: CountryConfig): string {
    return config.timeZone;
  },

  /**
   * Detect if an amount needs cross-currency conversion display.
   */
  needsConversion(fromCurrency: string, config: CountryConfig): boolean {
    return fromCurrency !== config.currency;
  },
};