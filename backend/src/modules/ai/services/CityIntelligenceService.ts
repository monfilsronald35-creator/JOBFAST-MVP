import { db }                  from '../../../core/database/SupabaseClient.js';
import { ExperienceRepository } from '../repositories/ExperienceRepository.js';
import type { CityDashboard }  from '../types/ai.types.js';

async function buildCityData(city: string, country: string): Promise<CityDashboard> {
  // Aggregate jobs data by category for top jobs
  const { data: jobs } = await db.client()
    .from('jobs')
    .select('category, budget, currency')
    .eq('status', 'open')
    .eq('country', country)
    .limit(200);

  const jobRows = jobs ?? [];
  const categoryMap: Record<string, { total: number; count: number; currency: string }> = {};
  for (const r of jobRows) {
    const row  = r as Record<string, unknown>;
    const cat  = String(row['category'] ?? 'General');
    const curr = String(row['currency'] ?? 'HTG');
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0, currency: curr };
    categoryMap[cat]!.total  += Number(row['budget'] ?? 0);
    categoryMap[cat]!.count  += 1;
  }

  const topJobs = Object.entries(categoryMap)
    .map(([title, v]) => ({ title, avgSalary: v.count > 0 ? Math.round(v.total / v.count / 100) : 0, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Hotel avg price from marketplace or travel
  const { data: hotelData } = await db.client()
    .from('srch_index')
    .select('price')
    .eq('source', 'hotels')
    .eq('country', country)
    .limit(20);

  const hotelPrices = (hotelData ?? []).map(r => Number((r as Record<string, unknown>)['price'] ?? 0));
  const avgHotelPrice = hotelPrices.length > 0
    ? Math.round(hotelPrices.reduce((s, p) => s + p, 0) / hotelPrices.length / 100)
    : 0;

  // Restaurant avg meal price
  const { data: restData } = await db.client()
    .from('srch_index')
    .select('price')
    .eq('source', 'restaurants')
    .eq('country', country)
    .limit(20);

  const restPrices = (restData ?? []).map(r => Number((r as Record<string, unknown>)['price'] ?? 0));
  const avgMealPrice = restPrices.length > 0
    ? Math.round(restPrices.reduce((s, p) => s + p, 0) / restPrices.length / 100)
    : 0;

  return {
    city,
    country,
    topJobs,
    avgHotelPrice,
    avgMealPrice,
    weather:       '29°C, Ensoleillé',
    economyRating: 72,
    touristRating: 85,
    updatedAt:     new Date().toISOString(),
  };
}

export const CityIntelligenceService = {
  async getDashboard(city: string, country: string): Promise<CityDashboard> {
    const cached = await ExperienceRepository.getCityCache(city, country);
    if (cached) return cached as unknown as CityDashboard;

    const dashboard = await buildCityData(city, country);
    void ExperienceRepository.saveCityCache(city, country, dashboard as unknown as Record<string, unknown>);
    return dashboard;
  },
};