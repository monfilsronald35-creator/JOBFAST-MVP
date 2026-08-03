/**
 * Feature Flag Platform
 * Centralizes flag evaluation with per-country, per-city, per-role,
 * per-user-group, and rollout-percentage targeting.
 *
 * Flag conditions (stored in feature_flags.conditions JSONB):
 *   {
 *     "countries":   ["HT", "DO", "US"],   // ISO 3166-1 alpha-2
 *     "cities":      ["Port-au-Prince"],    // free-text city name
 *     "roles":       ["worker","employer"], // JOBFAST role enum
 *     "userGroups":  ["premium","enterprise"],
 *     "rolloutPct":  50                     // overrides table-level rollout_pct
 *   }
 *
 * Evaluation order:
 *   1. emergency_disabled  → always false
 *   2. !enabled            → false
 *   3. conditions.countries → must include the user's country (if set)
 *   4. conditions.cities    → must include the user's city (if set)
 *   5. conditions.roles     → must include the user's role (if set)
 *   6. conditions.userGroups → must include at least one of the user's groups (if set)
 *   7. rollout_pct (from conditions or table): stable hash of userId % 100 < pct
 *   → true
 */
import { db } from '../../../core/database/SupabaseClient.js';

export interface FlagContext {
  userId?:     string;
  country?:    string;  // ISO 3166-1 alpha-2, e.g. 'HT'
  city?:       string;
  role?:       string;
  userGroups?: string[];
}

interface FlagRow {
  key:               string;
  enabled:           boolean;
  emergency_disabled?: boolean;
  rollout_pct?:      number;
  conditions?:       FlagConditions | null;
}

interface FlagConditions {
  countries?:   string[];
  cities?:      string[];
  roles?:       string[];
  userGroups?:  string[];
  rolloutPct?:  number;
}

// Stable bucket: djb2 hash of userId, produces 0-99
function _bucket(userId: string): number {
  let h = 5381;
  for (let i = 0; i < userId.length; i++) {
    h = ((h << 5) + h) ^ userId.charCodeAt(i);
    h = h & h; // 32-bit
  }
  return Math.abs(h) % 100;
}

function _evaluate(flag: FlagRow, ctx: FlagContext): boolean {
  if (flag.emergency_disabled) return false;
  if (!flag.enabled)           return false;

  const cond = flag.conditions as FlagConditions | null | undefined;

  if (cond?.countries?.length && ctx.country && !cond.countries.includes(ctx.country)) return false;
  if (cond?.cities?.length    && ctx.city    && !cond.cities.includes(ctx.city))       return false;
  if (cond?.roles?.length     && ctx.role    && !cond.roles.includes(ctx.role))        return false;
  if (cond?.userGroups?.length && ctx.userGroups) {
    const hasGroup = ctx.userGroups.some(g => cond.userGroups!.includes(g));
    if (!hasGroup) return false;
  }

  const pct = cond?.rolloutPct ?? flag.rollout_pct ?? 100;
  if (pct < 100 && ctx.userId) {
    if (_bucket(ctx.userId) >= pct) return false;
  }

  return true;
}

// 30-second in-memory cache to avoid a DB hit per request
let _cache:     FlagRow[] | null = null;
let _cacheExp:  number           = 0;

async function _loadFlags(): Promise<FlagRow[]> {
  if (_cache && Date.now() < _cacheExp) return _cache;
  const { data } = await db.client().from('feature_flags').select('key, enabled, emergency_disabled, rollout_pct, conditions');
  _cache    = (data ?? []) as FlagRow[];
  _cacheExp = Date.now() + 30_000;
  return _cache;
}

export const FeatureFlagService = {
  // Invalidate cache (call after admin changes a flag)
  invalidateCache(): void {
    _cache    = null;
    _cacheExp = 0;
  },

  // Evaluate all flags for a given context → { flagKey: boolean }
  async evaluateAll(ctx: FlagContext = {}): Promise<Record<string, boolean>> {
    const flags = await _loadFlags();
    const result: Record<string, boolean> = {};
    for (const flag of flags) {
      result[flag.key] = _evaluate(flag, ctx);
    }
    return result;
  },

  // Check a single flag
  async isEnabled(key: string, ctx: FlagContext = {}): Promise<boolean> {
    const flags = await _loadFlags();
    const flag  = flags.find(f => f.key === key);
    if (!flag) return false;
    return _evaluate(flag, ctx);
  },

  // Kill switch: emergency disable a flag immediately (bypasses cache)
  async emergencyDisable(actorId: string, key: string): Promise<void> {
    await db.client()
      .from('feature_flags')
      .update({ emergency_disabled: true, updated_by: actorId, updated_at: new Date().toISOString() })
      .eq('key', key);
    this.invalidateCache();
  },

  // Restore a flag from emergency disable
  async restore(actorId: string, key: string): Promise<void> {
    await db.client()
      .from('feature_flags')
      .update({ emergency_disabled: false, updated_by: actorId, updated_at: new Date().toISOString() })
      .eq('key', key);
    this.invalidateCache();
  },

  // Set per-country/city/role/userGroup conditions for a flag
  async setConditions(actorId: string, key: string, conditions: FlagConditions): Promise<void> {
    await db.client()
      .from('feature_flags')
      .update({ conditions, updated_by: actorId, updated_at: new Date().toISOString() })
      .eq('key', key);
    this.invalidateCache();
  },
};