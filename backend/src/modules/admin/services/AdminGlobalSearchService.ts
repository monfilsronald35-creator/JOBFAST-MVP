import { db } from '../../../core/database/SupabaseClient.js';

export type SearchEntityType = 'user' | 'job' | 'transaction' | 'moderation' | 'broadcast';

export interface SearchResult {
  entityType: SearchEntityType;
  id: string;
  title: string;
  subtitle?: string;
  preview?: string;
  createdAt?: number;
  url?: string;
}

export interface GlobalSearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
  durationMs: number;
}

export const AdminGlobalSearchService = {
  async search(query: string, limit = 20): Promise<GlobalSearchResponse> {
    if (!query || query.trim().length < 2) {
      return { query, total: 0, results: [], durationMs: 0 };
    }

    const t0  = Date.now();
    const q   = query.trim();
    const lim = Math.min(limit, 50);

    const [usersRes, jobsRes, txRes, modRes] = await Promise.allSettled([
      _searchUsers(q, lim),
      _searchJobs(q, lim),
      _searchTransactions(q, lim),
      _searchModeration(q, lim),
    ]);

    const results: SearchResult[] = [
      ...(usersRes.status === 'fulfilled' ? usersRes.value : []),
      ...(jobsRes.status  === 'fulfilled' ? jobsRes.value  : []),
      ...(txRes.status    === 'fulfilled' ? txRes.value    : []),
      ...(modRes.status   === 'fulfilled' ? modRes.value   : []),
    ].slice(0, lim);

    return {
      query,
      total:      results.length,
      results,
      durationMs: Date.now() - t0,
    };
  },
};

async function _searchUsers(q: string, limit: number): Promise<SearchResult[]> {
  const { data } = await db.client()
    .from('profiles')
    .select('id, name, email, role, created_at')
    .or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
    .limit(limit);
  return ((data ?? []) as Record<string, unknown>[]).map(row => ({
    entityType: 'user' as SearchEntityType,
    id:         row['id']    as string,
    title:      row['name']  as string,
    subtitle:   row['email'] as string,
    preview:    `Role: ${row['role'] as string}`,
    createdAt:  row['created_at'] ? new Date(row['created_at'] as string).getTime() : undefined,
  }));
}

async function _searchJobs(q: string, limit: number): Promise<SearchResult[]> {
  const { data } = await db.client()
    .from('jobs')
    .select('id, title, description, status, created_at')
    .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(limit);
  return ((data ?? []) as Record<string, unknown>[]).map(row => ({
    entityType: 'job' as SearchEntityType,
    id:         row['id']    as string,
    title:      row['title'] as string,
    subtitle:   `Status: ${row['status'] as string}`,
    preview:    String(row['description'] ?? '').slice(0, 100),
    createdAt:  row['created_at'] ? new Date(row['created_at'] as string).getTime() : undefined,
  }));
}

async function _searchTransactions(q: string, limit: number): Promise<SearchResult[]> {
  const { data } = await db.client()
    .from('mon_revenue_events')
    .select('id, service, transaction_ref, fee_amount, currency, created_at')
    .or(`transaction_ref.ilike.%${q}%,service.ilike.%${q}%`)
    .limit(limit);
  return ((data ?? []) as Record<string, unknown>[]).map(row => ({
    entityType: 'transaction' as SearchEntityType,
    id:         row['id']              as string,
    title:      `${row['service'] as string} — ${row['fee_amount'] as number} ${row['currency'] as string}`,
    subtitle:   row['transaction_ref'] as string | undefined,
    createdAt:  row['created_at'] ? new Date(row['created_at'] as string).getTime() : undefined,
  }));
}

async function _searchModeration(q: string, limit: number): Promise<SearchResult[]> {
  const { data } = await db.client()
    .from('moderation_queue')
    .select('id, entity_type, reason, status, created_at')
    .or(`reason.ilike.%${q}%,entity_type.ilike.%${q}%`)
    .limit(limit);
  return ((data ?? []) as Record<string, unknown>[]).map(row => ({
    entityType: 'moderation' as SearchEntityType,
    id:         row['id']          as string,
    title:      `${row['entity_type'] as string} — ${row['status'] as string}`,
    subtitle:   row['reason']      as string | undefined,
    createdAt:  row['created_at'] ? new Date(row['created_at'] as string).getTime() : undefined,
  }));
}
