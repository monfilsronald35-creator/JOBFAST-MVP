-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FAZ 27 — Analytics & Intelligence Platform (migration 027)
-- Prefix: anlt_
-- Run manually in Supabase SQL Editor
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── Events store (high volume) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS anlt_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID,
  session_id   TEXT,
  event_name   TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'system',
  properties   JSONB NOT NULL DEFAULT '{}',
  country      TEXT,
  city         TEXT,
  platform     TEXT DEFAULT 'web',
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (occurred_at);

-- Default partition for current period
CREATE TABLE IF NOT EXISTS anlt_events_2026
  PARTITION OF anlt_events
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- ── Sessions ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS anlt_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at     TIMESTAMPTZ,
  duration_sec INT NOT NULL DEFAULT 0,
  page_views   INT NOT NULL DEFAULT 0,
  events       INT NOT NULL DEFAULT 0,
  country      TEXT,
  platform     TEXT DEFAULT 'web'
);

-- ── Funnel definitions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS anlt_funnels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL,
  name        TEXT NOT NULL,
  step_names  JSONB NOT NULL DEFAULT '[]',
  period      TEXT NOT NULL DEFAULT '',
  results     JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Saved reports ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS anlt_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'custom',
  period      TEXT NOT NULL,
  filters     JSONB NOT NULL DEFAULT '{}',
  data        JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_anlt_events_name    ON anlt_events(event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_anlt_events_user    ON anlt_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_anlt_events_cat     ON anlt_events(category, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_anlt_sessions_user  ON anlt_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_anlt_reports_owner  ON anlt_reports(owner_id);