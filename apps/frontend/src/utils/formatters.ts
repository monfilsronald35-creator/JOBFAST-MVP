type AnyFn = (...args: never[]) => unknown;

export function debounce<T extends AnyFn>(fn: T, delay = 300): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>): void => {
    if (timeout !== undefined) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends AnyFn>(fn: T, limit = 300): (...args: Parameters<T>) => void {
  let waiting = false;
  return (...args: Parameters<T>): void => {
    if (waiting) return;
    fn(...args);
    waiting = true;
    setTimeout(() => { waiting = false; }, limit);
  };
}

export function uniqueArray<T>(array: T[] = []): T[] {
  return [...new Set(array)];
}

export function sortByDate<T extends Record<string, unknown>>(
  items: T[] = [],
  field: keyof T & string = 'createdAt',
): T[] {
  return [...items].sort(
    (a, b) =>
      new Date((b[field] as string | number | undefined) ?? 0).getTime() -
      new Date((a[field] as string | number | undefined) ?? 0).getTime(),
  );
}

export function sortByRating<T extends Record<string, unknown>>(
  items: T[] = [],
  field: keyof T & string = 'rating',
): T[] {
  return [...items].sort(
    (a, b) => (Number(b[field]) || 0) - (Number(a[field]) || 0),
  );
}

export function groupBy<T extends Record<string, unknown>>(
  array: T[] = [],
  key: keyof T & string,
): Record<string, T[]> {
  return array.reduce<Record<string, T[]>>((acc, item) => {
    const group = String(item[key] ?? 'unknown');
    (acc[group] ??= []).push(item);
    return acc;
  }, {});
}

export interface PaginationResult<T> {
  page: number;
  limit: number;
  total: number;
  pages: number;
  data: T[];
}

export function paginate<T>(items: T[] = [], page = 1, limit = 20): PaginationResult<T> {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 20);
  const start = (safePage - 1) * safeLimit;
  return {
    page: safePage,
    limit: safeLimit,
    total: items.length,
    pages: Math.ceil(items.length / safeLimit),
    data: items.slice(start, start + safeLimit),
  };
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce<Pick<T, K>>((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {} as Pick<T, K>);
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  return (Object.keys(obj) as K[]).reduce<Omit<T, K>>((acc, key) => {
    if (!keys.includes(key)) {
      (acc as Record<string, unknown>)[key as string] = obj[key];
    }
    return acc;
  }, {} as Omit<T, K>);
}

export function safeJsonParse<T = unknown>(value: unknown, fallback: T | null = null): T | null {
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

export function safeJsonStringify(value: unknown, fallback = ''): string {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

export function generateSlug(text = ''): string {
  return String(text)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function calculateCompletion(completed = 0, total = 0): number {
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}

export function isToday(dateString: string | number | Date): boolean {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function isFutureDate(dateString: string | number | Date): boolean {
  const date = new Date(dateString);
  return !Number.isNaN(date.getTime()) && date > new Date();
}

export function isPastDate(dateString: string | number | Date): boolean {
  const date = new Date(dateString);
  return !Number.isNaN(date.getTime()) && date < new Date();
}