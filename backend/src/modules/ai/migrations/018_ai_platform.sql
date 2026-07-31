-- 018_ai_platform.sql — AI Experience Platform
-- Run in Supabase SQL Editor

-- ── Daily Briefings Cache ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_briefings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  greeting     TEXT NOT NULL,
  items        JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '4 hours',
  UNIQUE (user_id, date)
);

-- ── AI User Preferences ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_preferences (
  user_id               UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  briefing_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  opportunities_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  city_intel_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  personalization_level TEXT NOT NULL DEFAULT 'standard'
    CHECK (personalization_level IN ('minimal','standard','full')),
  share_location        BOOLEAN NOT NULL DEFAULT FALSE,
  share_history         BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Opportunity Log ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_opportunities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  action_url  TEXT,
  score       NUMERIC(5,2) NOT NULL DEFAULT 50,
  is_seen     BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Experience Score ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_experience_scores (
  user_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date                 DATE NOT NULL,
  app_speed_score      NUMERIC(5,2) DEFAULT 0,
  search_success_rate  NUMERIC(5,2) DEFAULT 0,
  booking_success_rate NUMERIC(5,2) DEFAULT 0,
  job_success_rate     NUMERIC(5,2) DEFAULT 0,
  payment_success_rate NUMERIC(5,2) DEFAULT 0,
  avg_response_ms      INTEGER DEFAULT 0,
  notif_open_rate      NUMERIC(5,2) DEFAULT 0,
  conversion_rate      NUMERIC(5,2) DEFAULT 0,
  overall_score        NUMERIC(5,2) DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- ── City Intelligence Cache ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_city_cache (
  city         TEXT NOT NULL,
  country      TEXT NOT NULL,
  data         JSONB NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '6 hours',
  PRIMARY KEY (city, country)
);

-- ── Home Config Cache ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_home_configs (
  user_id     UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,
  widgets     JSONB NOT NULL DEFAULT '[]',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_briefings_user   ON ai_briefings(user_id, date);
CREATE INDEX IF NOT EXISTS idx_ai_briefings_expiry ON ai_briefings(expires_at) WHERE expires_at > NOW();
CREATE INDEX IF NOT EXISTS idx_ai_opps_user        ON ai_opportunities(user_id, is_seen, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_scores_user      ON ai_experience_scores(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_city_expiry      ON ai_city_cache(expires_at);