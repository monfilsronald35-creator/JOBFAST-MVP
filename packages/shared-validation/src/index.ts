import { z } from 'zod';

// ——— Reusable Zod schemas ——————————————————————————————————————————————————

export const zUUID   = z.string().uuid('UUID envalid');
export const zEmail  = z.string().email('Email envalid').toLowerCase().trim();
export const zPhone  = z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Nimewo telefòn envalid');
export const zUrl    = z.string().url('URL envalid');
export const zLocale = z.enum(['ht', 'fr', 'en', 'es', 'pt', 'ar']);

export const zPassword = z.string()
  .min(8,  'Modpas dwe gen omwen 8 karaktè')
  .max(128, 'Modpas twò long');

export const zName = z.string()
  .min(2,  'Non dwe gen omwen 2 karaktè')
  .max(100, 'Non twò long')
  .trim();

export const zMoneyAmount = z.number()
  .int('Montan dwe yon antye')
  .nonnegative('Montan pa ka negatif')
  .max(999_999_999, 'Montan twò gwo');

export const zCurrency = z.enum(['HTG', 'USD', 'EUR', 'GBP', 'BRL', 'CAD']);

export const zCursorPagination = z.object({
  cursor: z.string().optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
});

export const zGeoPoint = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// Helper to create a schema that strips unknown keys
export function strictSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}

// Re-export zod for convenience
export { z };
