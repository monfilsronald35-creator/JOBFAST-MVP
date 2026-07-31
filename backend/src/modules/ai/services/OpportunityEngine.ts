import { db }                  from '../../../core/database/SupabaseClient.js';
import { ExperienceRepository } from '../repositories/ExperienceRepository.js';
import type { UserContext }     from '../types/ai.types.js';

interface OpportunityCandidate {
  type:        string;
  title:       string;
  description: string;
  actionUrl?:  string | undefined;
  score:       number;
  expiresAt?:  string | undefined;
}

async function findJobOpportunities(ctx: UserContext): Promise<OpportunityCandidate[]> {
  if (ctx.role !== 'worker') return [];
  const { data } = await db.client()
    .from('jobs')
    .select('id, title, budget, currency, category')
    .eq('status', 'open')
    .eq('country', ctx.country)
    .order('created_at', { ascending: false })
    .limit(5);
  return (data ?? []).map(r => {
    const row = r as Record<string, unknown>;
    return {
      type:        'job',
      title:       `Nouvo travay: ${String(row['title'] ?? '')}`,
      description: `${String(row['category'] ?? '')} — ${String(row['currency'] ?? 'HTG')} ${Number(row['budget'] ?? 0) / 100}`,
      actionUrl:   `/jobs/${String(row['id'] ?? '')}`,
      score:       75,
      expiresAt:   new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    };
  });
}

async function findMarketplaceOpportunities(ctx: UserContext): Promise<OpportunityCandidate[]> {
  const { data } = await db.client()
    .from('mkt_products')
    .select('id, name, price, currency, category')
    .eq('status', 'active')
    .eq('country', ctx.country)
    .order('created_at', { ascending: false })
    .limit(3);
  return (data ?? []).map(r => {
    const row = r as Record<string, unknown>;
    return {
      type:        'product',
      title:       `Nouvo pwodwi: ${String(row['name'] ?? '')}`,
      description: `${String(row['category'] ?? '')} — ${Number(row['price'] ?? 0) / 100} ${String(row['currency'] ?? 'HTG')}`,
      actionUrl:   `/marketplace/${String(row['id'] ?? '')}`,
      score:       60,
    };
  });
}

export const OpportunityEngine = {
  async discover(ctx: UserContext): Promise<void> {
    const [jobOpps, marketplaceOpps] = await Promise.all([
      findJobOpportunities(ctx),
      ctx.role !== 'tourist' ? findMarketplaceOpportunities(ctx) : Promise.resolve([]),
    ]);

    const all = [...jobOpps, ...marketplaceOpps]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    for (const opp of all) {
      void ExperienceRepository.saveOpportunity({ ...opp, userId: ctx.userId });
    }
  },

  async list(userId: string, limit = 10) {
    return ExperienceRepository.listOpportunities(userId, limit);
  },

  async dismiss(id: string, userId: string): Promise<void> {
    await ExperienceRepository.markOpportunitySeen(id, userId);
  },
};