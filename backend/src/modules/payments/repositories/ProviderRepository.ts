import { db }       from '../../../core/database/SupabaseClient.js';
import { AppError } from '../../../core/errors/AppError.js';
import { ProviderName, ProviderCategory, ProviderStatus } from '../types/payment.types.js';
import type { ProviderConfig }                             from '../types/provider.types.js';

function toConfig(r: Record<string, unknown>): ProviderConfig {
  return {
    id:                  r['id']                    as string,
    name:                r['name']                  as ProviderName,
    category:            r['category']              as ProviderCategory,
    status:              r['status']                as ProviderStatus,
    supportedCountries:  r['supported_countries']   as string[],
    supportedCurrencies: r['supported_currencies']  as string[],
    supportedMethods:    r['supported_methods']     as string[],
    feePercentage:       r['fee_percentage']        as number,
    flatFee:             r['flat_fee']              as number,
    avgSuccessRate:      Number(r['avg_success_rate']),
    avgLatencyMs:        r['avg_latency_ms']        as number,
    priority:            r['priority']              as number,
    config:              (r['config'] as Record<string, unknown>) ?? {},
    createdAt:           r['created_at']            as string,
    updatedAt:           r['updated_at']            as string,
  };
}

export const ProviderRepository = {
  async listActive(): Promise<ProviderConfig[]> {
    const { data, error } = await db.client().from('pay_provider_configs').select('*')
      .neq('status', ProviderStatus.Inactive).order('priority', { ascending: true })
      .returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to load provider configs', 500, 'DB_ERROR');
    return (data ?? []).map(toConfig);
  },

  async findByName(name: ProviderName): Promise<ProviderConfig | null> {
    const { data } = await db.client().from('pay_provider_configs').select('*')
      .eq('name', name).single<Record<string, unknown>>();
    return data ? toConfig(data) : null;
  },

  // Filter providers that support the given country + currency + method
  async findEligible(country: string, currency: string, method: string): Promise<ProviderConfig[]> {
    // GIN-based overlap queries for arrays
    const { data, error } = await db.client().from('pay_provider_configs').select('*')
      .neq('status', ProviderStatus.Down)
      .neq('status', ProviderStatus.Inactive)
      .contains('supported_currencies', [currency])
      .contains('supported_methods', [method])
      .order('priority', { ascending: true })
      .returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to query providers', 500, 'DB_ERROR');
    const configs = (data ?? []).map(toConfig);
    // Filter country: '*' means global (e.g., crypto), or country is in list
    return configs.filter(c =>
      c.supportedCountries.includes('*') || c.supportedCountries.includes(country.toUpperCase())
    );
  },

  async updateMetrics(name: ProviderName, successRate: number, latencyMs: number): Promise<void> {
    await db.client().from('pay_provider_configs').update({
      avg_success_rate: successRate, avg_latency_ms: latencyMs,
      updated_at: new Date().toISOString(),
    }).eq('name', name);
  },

  async setStatus(name: ProviderName, status: ProviderStatus): Promise<void> {
    await db.client().from('pay_provider_configs').update({
      status, updated_at: new Date().toISOString(),
    }).eq('name', name);
  },
};
