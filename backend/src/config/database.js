// MongoDB removed — Supabase is the primary database.
// This file is kept as a no-op so server.js import paths don't break.

export async function connectDatabase() {
  console.log('[DB] Supabase PostgreSQL is the primary database.');
}

export async function disconnectDatabase() {}

export function isDbConnected() { return false; }