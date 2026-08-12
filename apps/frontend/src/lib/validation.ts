// Mirrors email_dom constraint from Migration 001 Part 1
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export type EmailAddress = string & { readonly __brand: 'EmailAddress' };

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function asEmail(value: string): EmailAddress {
  if (!isValidEmail(value)) {
    throw new Error(`Invalid email address: ${value}`);
  }
  return value.trim() as EmailAddress;
}

// Mirrors phone_dom constraint from Migration 001 Part 1
// Haiti: +509 XXXX XXXX (8 digits after country code)
const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

export type PhoneNumber = string & { readonly __brand: 'PhoneNumber' };

export function isValidPhone(value: string): boolean {
  return PHONE_REGEX.test(value.replace(/[\s\-().]/g, ''));
}

export function asPhone(value: string): PhoneNumber {
  const normalized = value.replace(/[\s\-().]/g, '');
  if (!isValidPhone(normalized)) {
    throw new Error(`Invalid phone number: ${value}`);
  }
  return normalized as PhoneNumber;
}

export function formatHaitianPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 8) return `+509 ${digits.slice(0, 4)} ${digits.slice(4)}`;
  if (digits.startsWith('509') && digits.length === 11) {
    return `+509 ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  return value;
}
