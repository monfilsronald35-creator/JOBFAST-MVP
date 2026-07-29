export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const cleaned = String(phone).replace(/[^\d+]/g, '');
  return /^(?:\+509\d{8}|\+1\d{10}|\d{8}|\d{10}|\+\d{7,15})$/.test(cleaned);
}

export function isValidEmail(email: unknown): boolean {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isPasswordStrong(password: unknown): boolean {
  if (!password || typeof password !== 'string') return false;
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

export function isNotEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  return String(value).trim().length > 0;
}