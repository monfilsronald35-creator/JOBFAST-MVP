import { TelecomRepository }  from '../repositories/TelecomRepository.js';
import type { TelecomBundle, BundleType } from '../types/telecom.types.js';

export const BundleEngine = {
  async create(operatorId: string, input: {
    name: string; code: string; type: BundleType; description: string;
    price: number; currency: string; validityDays: number;
    dataGb?: number; minutesMins?: number; smsCount?: number;
    speed?: string; coverage?: string; bonus?: string;
    isRenewable?: boolean; countries?: string[]; tags?: string[];
  }): Promise<TelecomBundle> {
    return TelecomRepository.createBundle({
      operatorId, name: input.name, code: input.code.toUpperCase(),
      type: input.type, description: input.description,
      price: input.price, currency: input.currency,
      validityDays: input.validityDays,
      dataGb: input.dataGb, minutesMins: input.minutesMins, smsCount: input.smsCount,
      speed: input.speed, coverage: input.coverage, bonus: input.bonus,
      isRenewable: input.isRenewable ?? true,
      countries: input.countries ?? [], tags: input.tags ?? [],
      isActive: true,
    });
  },

  async list(operatorId: string, type?: string): Promise<TelecomBundle[]> {
    return TelecomRepository.listBundles(operatorId, type);
  },

  async get(id: string): Promise<TelecomBundle | null> {
    return TelecomRepository.getBundle(id);
  },

  async search(operatorId: string, query: {
    type?: string; maxPrice?: number; minData?: number; country?: string;
  }): Promise<TelecomBundle[]> {
    const all = await TelecomRepository.listBundles(operatorId, query.type);
    return all.filter(b => {
      if (query.maxPrice !== undefined && b.price > query.maxPrice) return false;
      if (query.minData  !== undefined && (b.dataGb ?? 0) < query.minData) return false;
      if (query.country  && b.countries.length > 0 && !b.countries.includes(query.country)) return false;
      return true;
    });
  },

  async recommend(operatorId: string, usage: { data: boolean; calls: boolean; sms: boolean; country?: string }): Promise<TelecomBundle[]> {
    const all = await TelecomRepository.listBundles(operatorId);
    let scored = all.map(b => {
      let score = 0;
      if (usage.data  && (b.dataGb ?? 0) > 0)      score += 30;
      if (usage.calls && (b.minutesMins ?? 0) > 0)  score += 30;
      if (usage.sms   && (b.smsCount ?? 0) > 0)     score += 20;
      if (b.type === 'combo')                        score += 20;
      if (usage.country && b.countries.includes(usage.country)) score += 10;
      return { bundle: b, score };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, 5).map(s => s.bundle);
  },

  formatDetails(b: TelecomBundle): string {
    const parts: string[] = [];
    if (b.dataGb)      parts.push(`${b.dataGb}GB Entènèt`);
    if (b.minutesMins) parts.push(`${b.minutesMins} minit`);
    if (b.smsCount)    parts.push(`${b.smsCount} SMS`);
    if (b.validityDays) parts.push(`${b.validityDays} jou`);
    if (b.bonus)        parts.push(`Bonus: ${b.bonus}`);
    return parts.join(' • ');
  },
};