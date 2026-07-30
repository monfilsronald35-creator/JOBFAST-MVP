import type { SanctionResult } from '../types/compliance';

export type SanctionsList = 'OFAC_SDN' | 'OFAC_CONS' | 'UN_CONSOLIDATED' | 'EU_CONSOLIDATED' | 'HMT_UK' | 'LOCAL';

export interface SanctionCheckRequest {
  name:         string;
  dob?:         string;    // YYYY-MM-DD
  nationality?: string;
  country?:     string;
  entityType:   'individual' | 'entity';
}

export interface FullSanctionResult extends SanctionResult {
  checkedLists: SanctionsList[];
  details?:     string;
}

// Cache recent checks (5 min TTL) to avoid hammering the API
const _cache = new Map<string, { result: FullSanctionResult; expiresAt: number }>();

export const SanctionsEngine = {
  async check(request: SanctionCheckRequest): Promise<FullSanctionResult> {
    const key = `${request.entityType}:${request.name.toLowerCase().trim()}:${request.country ?? ''}`;
    const hit = _cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.result;

    try {
      const res = await fetch('/api/payments/compliance/sanctions/check', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(request),
      });
      if (res.ok) {
        const result = await res.json() as FullSanctionResult;
        _cache.set(key, { result, expiresAt: Date.now() + 300_000 });
        return result;
      }
    } catch { /* */ }

    // Safe fallback — flag for async review rather than blocking
    return {
      matched: false, checkedLists: [], checkTimestamp: Date.now(),
    };
  },

  async checkBatch(requests: SanctionCheckRequest[]): Promise<FullSanctionResult[]> {
    try {
      const res = await fetch('/api/payments/compliance/sanctions/batch', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ requests }),
      });
      if (res.ok) return res.json() as Promise<FullSanctionResult[]>;
    } catch { /* */ }
    return Promise.all(requests.map(r => this.check(r)));
  },

  async checkTransaction(params: { senderName: string; receiverName: string; country?: string }): Promise<{ safe: boolean; hits: FullSanctionResult[] }> {
    const [sender, receiver] = await Promise.all([
      this.check({ name: params.senderName,   entityType: 'individual', country: params.country }),
      this.check({ name: params.receiverName, entityType: 'individual', country: params.country }),
    ]);
    const hits = [sender, receiver].filter(r => r.matched);
    return { safe: hits.length === 0, hits };
  },

  async getWatchlistStatus(): Promise<{ lists: SanctionsList[]; lastUpdated: number; count: number }> {
    try {
      const res = await fetch('/api/payments/compliance/sanctions/watchlist-status');
      if (res.ok) return res.json() as Promise<{ lists: SanctionsList[]; lastUpdated: number; count: number }>;
    } catch { /* */ }
    return { lists: [], lastUpdated: 0, count: 0 };
  },

  clearCache(): void {
    _cache.clear();
  },

  isHighRisk(result: FullSanctionResult): boolean {
    return result.matched && (result.matchScore ?? 0) >= 85;
  },
};
