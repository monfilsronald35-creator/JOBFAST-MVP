/**
 * CountryContextEngine — builds and persists CountryContext per user.
 * Combines detection signals, user-confirmed preference, and country config.
 */
import type { Request } from 'express';
import { db }                     from '../../../core/database/SupabaseClient.js';
import { CountryConfigService }   from './CountryConfigService.js';
import { CountryDetectionService } from './CountryDetectionService.js';
import type { CountryContext, CountryConfig, CountryFeatures, LocalizationContext } from '../types/localization.types.js';

const DEFAULT_CTX: CountryContext = {
  country: 'HT', timeZone: 'America/Port-au-Prince',
  currency: 'HTG', language: 'ht', detectedFrom: 'default',
};

function _row(r: Record<string, unknown>): CountryContext {
  const ctx: CountryContext = {
    country:      String(r['country']      ?? 'HT'),
    timeZone:     String(r['time_zone']    ?? 'America/Port-au-Prince'),
    currency:     String(r['currency']     ?? 'HTG'),
    language:     String(r['language']     ?? 'ht'),
    detectedFrom: (r['detected_from'] as CountryContext['detectedFrom']) ?? 'default',
  };
  if (r['region'])        ctx.region        = String(r['region']);
  if (r['state'])         ctx.state         = String(r['state']);
  if (r['city'])          ctx.city          = String(r['city']);
  if (r['preferred_lang']) ctx.preferredLang = String(r['preferred_lang']);
  if (r['confirmed_at'])  ctx.confirmedAt   = String(r['confirmed_at']);
  return ctx;
}

export const CountryContextEngine = {
  /**
   * Build a LocalizationContext for a request.
   * Authenticated users: load from DB (with detection fallback).
   * Anonymous users:     detect from request headers.
   */
  async buildForRequest(req: Request, userId?: string): Promise<LocalizationContext> {
    let ctx: CountryContext;

    if (userId) {
      const { data } = await db.client()
        .from('loc_user_context')
        .select('*, loc_countries!inner(currency, time_zone, primary_language)')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        ctx = _row(data as Record<string, unknown>);
        // Enrich with country config data if missing
        const country = data as Record<string, unknown>;
        const inner   = country['loc_countries'] as Record<string, unknown> | null;
        if (inner) {
          if (!ctx.currency) ctx.currency = String(inner['currency'] ?? 'HTG');
          if (!ctx.timeZone) ctx.timeZone = String(inner['time_zone'] ?? 'UTC');
        }
      } else {
        ctx = await this._detectAndSave(req, userId);
      }
    } else {
      const detection = CountryDetectionService.fromRequest(req);
      const config    = await CountryConfigService.getConfig(detection.country);
      ctx = {
        country:      detection.country,
        timeZone:     config?.timeZone    ?? 'UTC',
        currency:     config?.currency    ?? 'USD',
        language:     config?.primaryLanguage ?? 'en',
        detectedFrom: detection.detectedFrom,
      };
    }

    const [config, features] = await Promise.all([
      CountryConfigService.getConfig(ctx.country),
      CountryConfigService.getFeatures(ctx.country),
    ]);

    return {
      ctx,
      config:   config ?? _fallbackConfig(ctx.country),
      features: features,
    };
  },

  /**
   * Confirm a country context for an authenticated user.
   * Called when the user acknowledges the "Are you in X?" prompt.
   */
  async confirmContext(userId: string, country: string, city?: string, state?: string): Promise<CountryContext> {
    const config = await CountryConfigService.getConfig(country);
    const row: Record<string, unknown> = {
      user_id:       userId,
      country,
      time_zone:     config?.timeZone        ?? 'UTC',
      language:      config?.primaryLanguage  ?? 'en',
      currency:      config?.currency        ?? 'USD',
      detected_from: 'user_selected',
      confirmed_at:  new Date().toISOString(),
      updated_at:    new Date().toISOString(),
    };
    if (city)  row['city']  = city;
    if (state) row['state'] = state;

    await db.client().from('loc_user_context').upsert(row, { onConflict: 'user_id' });

    const ctx: CountryContext = {
      country, detectedFrom: 'user_selected',
      timeZone:  config?.timeZone ?? 'UTC',
      currency:  config?.currency ?? 'USD',
      language:  config?.primaryLanguage ?? 'en',
      confirmedAt: new Date().toISOString(),
    };
    if (city)  ctx.city  = city;
    if (state) ctx.state = state;
    return ctx;
  },

  /**
   * Update partial context fields (e.g. preferred language).
   */
  async updateContext(userId: string, updates: Partial<CountryContext>): Promise<void> {
    const row: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() };
    if (updates.country)       row['country']        = updates.country;
    if (updates.city)          row['city']           = updates.city;
    if (updates.state)         row['state']          = updates.state;
    if (updates.preferredLang) row['preferred_lang'] = updates.preferredLang;
    if (updates.language)      row['language']       = updates.language;
    await db.client().from('loc_user_context').upsert(row, { onConflict: 'user_id' });
  },

  async getUserContext(userId: string): Promise<CountryContext | null> {
    const { data } = await db.client()
      .from('loc_user_context')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (!data) return null;
    return _row(data as Record<string, unknown>);
  },

  // Internal: detect from request, save to DB, return context
  async _detectAndSave(req: Request, userId: string): Promise<CountryContext> {
    const detection = CountryDetectionService.fromRequest(req);
    const config    = await CountryConfigService.getConfig(detection.country);
    const ctx: CountryContext = {
      country:      detection.country,
      timeZone:     config?.timeZone          ?? 'UTC',
      currency:     config?.currency          ?? 'USD',
      language:     config?.primaryLanguage   ?? 'en',
      detectedFrom: detection.detectedFrom,
    };
    const row: Record<string, unknown> = {
      user_id:       userId,
      country:       ctx.country,
      time_zone:     ctx.timeZone,
      language:      ctx.language,
      detected_from: ctx.detectedFrom,
      updated_at:    new Date().toISOString(),
    };
    await db.client().from('loc_user_context').upsert(row, { onConflict: 'user_id' });
    return ctx;
  },
};

function _fallbackConfig(code: string): CountryConfig {
  return {
    code, name: code, nativeName: code, flag: '🌍',
    currency: 'USD', languages: ['en'], primaryLanguage: 'en',
    timeZone: 'UTC', callingCode: '', minAge: 18,
    emergencyNumbers: { police: '911', fire: '911', ambulance: '911' },
    banks: [], wallets: [], telecomProviders: [], paymentMethods: [],
    taxRate: 0, vatRate: 0,
    dateFormat: 'DD/MM/YYYY', timeFormat: '24h',
    numberFormat: { decimalSeparator: '.', thousandSeparator: ',', currencyPosition: 'before' },
    addressFormat: [], governmentApis: false, active: true,
  };
}