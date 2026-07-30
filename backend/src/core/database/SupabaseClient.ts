import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!url || !key) {
    throw new Error('[SupabaseClient] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  _client = createClient(url, key, {
    auth: {
      autoRefreshToken:  false,
      persistSession:    false,
      detectSessionInUrl: false,
    },
    db: { schema: 'public' },
  });

  return _client;
}

// Typed query helper — throws on Supabase error
export async function dbQuery<T>(
  fn: (client: SupabaseClient) => Promise<{ data: T | null; error: unknown }>,
): Promise<T> {
  const client = getClient();
  const { data, error } = await fn(client);
  if (error) throw error;
  if (data === null) throw new Error('Query returned null');
  return data;
}

// Same but returns null instead of throwing when data is null
export async function dbQueryNullable<T>(
  fn: (client: SupabaseClient) => Promise<{ data: T | null; error: unknown }>,
): Promise<T | null> {
  const client = getClient();
  const { data, error } = await fn(client);
  if (error) throw error;
  return data;
}

export const db = {
  client: getClient,
  query:  dbQuery,
  queryNullable: dbQueryNullable,
};
