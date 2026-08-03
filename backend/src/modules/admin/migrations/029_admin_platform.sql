-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FAZ 29 — Admin & Governance Platform (migration 029)
-- Prefix: adm_
-- Run manually in Supabase SQL Editor
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── Moderation queue ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS moderation_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  TEXT NOT NULL,
  entity_id    UUID NOT NULL,
  reported_by  UUID NOT NULL,
  reason       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  resolver_id  UUID,
  resolution   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);

-- ── Feature flags ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_flags (
  key          TEXT PRIMARY KEY,
  enabled      BOOLEAN NOT NULL DEFAULT false,
  description  TEXT NOT NULL DEFAULT '',
  rollout_pct  NUMERIC(5,2) NOT NULL DEFAULT 100,
  updated_by   UUID NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── System config ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_config (
  key          TEXT PRIMARY KEY,
  value        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  is_secret    BOOLEAN NOT NULL DEFAULT false,
  updated_by   UUID NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Audit log ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adm_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action       TEXT NOT NULL,
  actor_id     UUID NOT NULL,
  target_id    UUID,
  target_type  TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_modq_status      ON moderation_queue(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_modq_entity      ON moderation_queue(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor      ON adm_audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target     ON adm_audit_log(target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action     ON adm_audit_log(action, created_at DESC);

-- ── Seed default feature flags ────────────────────────────────────────────────
INSERT INTO feature_flags (key, enabled, description, rollout_pct, updated_by)
VALUES
  ('telemedicine',       true,  'Telemedicine video sessions',           100, gen_random_uuid()),
  ('marketplace_v2',     true,  'New marketplace UI',                     100, gen_random_uuid()),
  ('ai_triage',          true,  'AI healthcare triage assistant',         100, gen_random_uuid()),
  ('analytics_export',   false, 'CSV/PDF export from analytics dashboard', 0, gen_random_uuid()),
  ('multi_currency',     false, 'Multi-currency payment support',          0, gen_random_uuid())
ON CONFLICT (key) DO NOTHING;