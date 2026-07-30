import { randomUUID } from 'crypto';

// ——— ID generation ————————————————————————————————————————————————————————

export const generateId = (): string => randomUUID();

// ——— Pagination ——————————————————————————————————————————————————————————————

export interface CursorPayload { id: string; createdAt: number }

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString()) as CursorPayload;
  } catch { return null; }
}

// ——— Date ————————————————————————————————————————————————————————————————————

export const nowMs = (): number => Date.now();

export function msToISO(ms: number): string {
  return new Date(ms).toISOString();
}

// ——— String ——————————————————————————————————————————————————————————————————

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return '***';
  return `${user[0]}***${user.slice(-1)}@${domain}`;
}

// ——— Object ——————————————————————————————————————————————————————————————————

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const k of keys) delete result[k];
  return result as Omit<T, K>;
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const k of keys) result[k] = obj[k];
  return result;
}

// ——— Money ——————————————————————————————————————————————————————————————————

/** Convert integer minor units to display string — e.g. 1050 → "10.50" */
export function formatMinorUnits(amount: number, currency = 'USD'): string {
  const divisor = currency === 'HTG' ? 100 : 100;
  return (amount / divisor).toFixed(2);
}

// ——— Retry ——————————————————————————————————————————————————————————————————

export async function withRetry<T>(
  fn:          () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 500,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try { return await fn(); }
    catch (err) {
      lastErr = err;
      if (attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, baseDelayMs * 2 ** attempt));
      }
    }
  }
  throw lastErr;
}
