/**
 * supabaseClient.js — Singleton Supabase clients for the JOBFAST backend.
 *
 * THREE clients, three purposes:
 *
 *  supabase (default export) — service-role client.
 *    Bypasses RLS. Used by all repositories for server-side CRUD.
 *    NEVER expose this key to the browser.
 *
 *  supabaseAnon — anon-key client.
 *    Respects RLS. Used only when we want to verify a user's token
 *    via supabase.auth.getUser(token).
 *
 *  supabaseAsUser(token) — per-request user-scoped client.
 *    Useful when a controller must execute a query that MUST obey RLS
 *    (e.g. storage uploads on behalf of the authenticated user).
 */

import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// ── Guard: fail fast if Supabase is not configured ─────────────────────────
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '[Supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. ' +
    'Add them to .env before starting the server.'
  );
}

// ── Service-role client (server-side — bypasses RLS) ───────────────────────
const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
      detectSessionInUrl: false,
    },
    db: { schema: 'public' },
    global: {
      headers: { 'x-application-name': 'jobfast-backend' },
    },
  }
);

// ── Anon client (token verification + RLS-scoped queries) ──────────────────
export const supabaseAnon = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken:   false,
      persistSession:     false,
      detectSessionInUrl: false,
    },
  }
);

/**
 * Create a one-off client that acts as the authenticated user.
 * Useful for Supabase Storage uploads that must honour user-level RLS.
 * Do NOT cache this — create a new one per request.
 */
export function supabaseAsUser(accessToken) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      autoRefreshToken:   false,
      persistSession:     false,
      detectSessionInUrl: false,
    },
  });
}

export default supabase;