/**
 * Money Value Object — all monetary arithmetic in integer minor units.
 *
 * HTG: 50000 = 500.00 HTG (centimes)
 * USD: 1999  = 19.99 USD  (cents)
 *
 * Never use floating point for money. Never store formatted strings in DB.
 * Format at the presentation layer only (fromMinorUnits + Intl.NumberFormat).
 */

export const SUPPORTED_CURRENCIES = Object.freeze({
  HTG: { code: 'HTG', minorUnit: 2, name: 'Haitian Gourde' },
  USD: { code: 'USD', minorUnit: 2, name: 'US Dollar' },
  EUR: { code: 'EUR', minorUnit: 2, name: 'Euro' },
});

export const SUPPORTED_CURRENCY_CODES = Object.keys(SUPPORTED_CURRENCIES);

function getCurrencyDef(currency) {
  const def = SUPPORTED_CURRENCIES[currency];
  if (!def) throw new FinancialError(`Unsupported currency: ${currency}`);
  return def;
}

export class FinancialError extends Error {
  constructor(message, code = 'FINANCIAL_ERROR') {
    super(message);
    this.name = 'FinancialError';
    this.code = code;
    this.statusCode = 422;
  }
}

/** Convert a major-unit amount (e.g. 500.00) to integer minor units (50000). */
export function toMinorUnits(amount, currency = 'HTG') {
  const def = getCurrencyDef(currency);
  return Math.round(Number(amount) * Math.pow(10, def.minorUnit));
}

/** Convert integer minor units back to major units for display only. */
export function fromMinorUnits(minorAmount, currency = 'HTG') {
  const def = getCurrencyDef(currency);
  return minorAmount / Math.pow(10, def.minorUnit);
}

/** Add two minor-unit amounts. */
export function add(a, b) {
  return a + b;
}

/** Subtract b from a. Throws FinancialError if result would be negative. */
export function subtract(a, b, label = 'balance') {
  if (b > a) throw new FinancialError(`Insufficient ${label}`, 'INSUFFICIENT_FUNDS');
  return a - b;
}

/** Multiply a minor-unit amount by a decimal factor (e.g. commission rate). */
export function multiply(minorAmount, factor) {
  return Math.round(minorAmount * factor);
}

/** Assert amount is a positive integer in minor units. */
export function assertPositive(amount, label = 'amount') {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new FinancialError(`${label} must be a positive integer in minor units`, 'INVALID_AMOUNT');
  }
}

/** Assert amount is a non-negative integer in minor units. */
export function assertNonNegative(amount, label = 'amount') {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new FinancialError(`${label} must be a non-negative integer in minor units`, 'INVALID_AMOUNT');
  }
}

/** Validate that a and b are the same currency. */
export function assertSameCurrency(currencyA, currencyB) {
  if (currencyA !== currencyB) {
    throw new FinancialError(
      `Currency mismatch: ${currencyA} vs ${currencyB}`,
      'CURRENCY_MISMATCH'
    );
  }
}