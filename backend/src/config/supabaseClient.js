/**
 * supabaseClient.js — Singleton Supabase clients for the JOBFAST backend.
 *
 *  supabase (default export) — service-role client. Bypasses RLS.
 *  supabaseAnon              — anon-key client. Respects RLS.
 *  supabaseAsUser(token)     — per-request user-scoped client for storage ops.
 */

import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { env } from './env.js';

const configured = !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

if (!configured) {
  console.error(
    '[Supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. ' +
    'Add them to .env — all database operations will fail until this is fixed.'
  );
}

function makeClient(url, key, opts = {}) {
  if (!url || !key) {
    return new Proxy({}, {
      get(_, prop) {
        if (prop === 'then') return undefined;
        return () => { throw new Error('[Supabase] Client not configured — set SUPABASE_URL and keys in .env'); };
      },
    });
  }
  // Pass ws for Node 20 compatibility (SDK v2.110+ requires native WebSocket = Node 22)
  return createClient(url, key, { ...opts, realtime: { transport: ws, ...opts.realtime } });
}

// ── Service-role client (server-side — bypasses RLS) ───────────────────────
const supabase = makeClient(
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
export const supabaseAnon = makeClient(
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
 * Create a one-off client scoped to the authenticated user.
 * Useful for storage uploads that must honour user-level RLS.
 */
export function supabaseAsUser(accessToken) {
  return makeClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export default supabase;