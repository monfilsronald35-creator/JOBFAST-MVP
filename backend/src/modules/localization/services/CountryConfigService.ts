/**
 * CountryConfigService — loads and caches all country configurations.
 * 5-minute TTL in-memory cache; reads from loc_countries + loc_country_features.
 * Falls back to hardcoded defaults for HT/DO/US if DB is empty.
 */
import { db } from '../../../core/database/SupabaseClient.js';
import type { CountryConfig, CountryFeatures } from '../types/localization.types.js';

const DEFAULT_FEATURES: CountryFeatures = {
  country: '', wallet: false, telecom: false, travel: false,
  marketplace: false, healthcare: false, government: false,
  ai: true, enterprise: false, maps: true,
};

interface CacheEntry { configs: Map<string, CountryConfig>; features: Map<string, CountryFeatures>; }
let _cache:    CacheEntry | null = null;
let _cacheExp: number            = 0;

async function _load(): Promise<CacheEntry> {
  if (_cache && Date.now() < _cacheExp) return _cache;

  const [{ data: countryRows }, { data: featureRows }] = await Promise.all([
    db.client().from('loc_countries').select('*').eq('active', true),
    db.client().from('loc_country_features').select('*'),
  ]);

  const configs  = new Map<string, CountryConfig>();
  const features = new Map<string, CountryFeatures>();

  for (const r of (countryRows ?? []) as Record<string, unknown>[]) {
    const ef = r['emergency_numbers'] as Record<string, string> | null ?? {};
    const nf = r['number_format'] as Record<string, string> | null ?? {};
    const config: CountryConfig = {
      code:             String(r['code']             ?? ''),
      name:             String(r['name']             ?? ''),
      nativeName:       String(r['native_name']      ?? ''),
      flag:             String(r['flag']             ?? '🌍'),
      currency:         String(r['currency']         ?? 'USD'),
      languages:        (r['languages']         as string[] | null) ?? [],
      primaryLanguage:  String(r['primary_language'] ?? 'en'),
      timeZone:         String(r['time_zone']        ?? 'UTC'),
      callingCode:      String(r['calling_code']     ?? ''),
      emergencyNumbers: {
        police:    ef['police']    ?? '911',
        fire:      ef['fire']      ?? '911',
        ambulance: ef['ambulance'] ?? '911',
      },
      banks:            (r['banks']            as string[] | null) ?? [],
      wallets:          (r['wallets']          as string[] | null) ?? [],
      telecomProviders: (r['telecom_providers'] as string[] | null) ?? [],
      paymentMethods:   (r['payment_methods']  as string[] | null) ?? [],
      taxRate:          Number(r['tax_rate']  ?? 0),
      vatRate:          Number(r['vat_rate']  ?? 0),
      dateFormat:       String(r['date_format']  ?? 'DD/MM/YYYY'),
      timeFormat:       (r['time_format'] as '24h' | '12h' | null) ?? '24h',
      numberFormat: {
        decimalSeparator:  (nf['decimalSeparator']  as '.' | ',')  ?? '.',
        thousandSeparator: (nf['thousandSeparator'] as ',' | '.' | ' ') ?? ',',
        currencyPosition:  (nf['currencyPosition']  as 'before' | 'after') ?? 'before',
      },
      addressFormat:    (r['address_format'] as string[] | null) ?? [],
      minAge:           Number(r['min_age'] ?? 18),
      governmentApis:   Boolean(r['government_apis']),
      active:           Boolean(r['active'] ?? true),
    };
    if (r['legal_notes']) config.legalNotes = String(r['legal_notes']);
    if (ef['general'])    config.emergencyNumbers.general = ef['general'];
    configs.set(config.code, config);
  }

  for (const r of (featureRows ?? []) as Record<string, unknown>[]) {
    const feat: CountryFeatures = {
      country:     String(r['country']     ?? ''),
      wallet:      Boolean(r['wallet']),
      telecom:     Boolean(r['telecom']),
      travel:      Boolean(r['travel']),
      marketplace: Boolean(r['marketplace']),
      healthcare:  Boolean(r['healthcare']),
      government:  Boolean(r['government']),
      ai:          Boolean(r['ai'] ?? true),
      enterprise:  Boolean(r['enterprise']),
      maps:        Boolean(r['maps'] ?? true),
    };
    features.set(feat.country, feat);
  }

  _cache    = { configs, features };
  _cacheExp = Date.now() + 5 * 60_000;
  return _cache;
}

export const CountryConfigService = {
  invalidateCache(): void { _cache = null; _cacheExp = 0; },

  async getConfig(code: string): Promise<CountryConfig | null> {
    const { configs } = await _load();
    return configs.get(code.toUpperCase()) ?? null;
  },

  async getFeatures(code: string): Promise<CountryFeatures> {
    const { features } = await _load();
    return features.get(code.toUpperCase()) ?? { ...DEFAULT_FEATURES, country: code };
  },

  async listAll(): Promise<CountryConfig[]> {
    const { configs } = await _load();
    return [...configs.values()];
  },

  async listActive(): Promise<CountryConfig[]> {
    const all = await this.listAll();
    return all.filter(c => c.active);
  },

  async updateFeatures(country: string, updates: Partial<Omit<CountryFeatures, 'country'>>): Promise<void> {
    const row: Record<string, unknown> = { country, updated_at: new Date().toISOString(), ...updates };
    await db.client().from('loc_country_features').upsert(row, { onConflict: 'country' });
    this.invalidateCache();
  },

  // Dynamic app identity label: 'JOBFAST HT', 'JOBFAST RD', 'JOBFAST US'...
  getAppLabel(countryCode: string): string {
    const LABELS: Record<string, string> = {
      HT: 'JOBFAST HT', DO: 'JOBFAST RD', US: 'JOBFAST US',
      FR: 'JOBFAST FR', CA: 'JOBFAST CA', BR: 'JOBFAST BR',
      DE: 'JOBFAST DE', AE: 'JOBFAST AE', MX: 'JOBFAST MX',
      CO: 'JOBFAST CO', GB: 'JOBFAST GB',
    };
    return LABELS[countryCode.toUpperCase()] ?? `JOBFAST ${countryCode.toUpperCase()}`;
  },
};