-- Migration 036: Global Admin Operating System (FAZ 23)
-- Extends the existing admin module (029_admin_platform.sql).
-- Run manually in Supabase SQL Editor.

-- ── Emergency mode ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adm_emergency_config (
  id                   TEXT        PRIMARY KEY DEFAULT 'singleton',
  active               BOOLEAN     NOT NULL DEFAULT false,
  payments_disabled    BOOLEAN     NOT NULL DEFAULT false,
  wallet_readonly      BOOLEAN     NOT NULL DEFAULT false,
  marketplace_readonly BOOLEAN     NOT NULL DEFAULT false,
  ai_disabled          BOOLEAN     NOT NULL DEFAULT false,
  registration_blocked BOOLEAN     NOT NULL DEFAULT false,
  external_api_blocked BOOLEAN     NOT NULL DEFAULT false,
  reason               TEXT,
  activated_at         TIMESTAMPTZ,
  activated_by         UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  deactivated_at       TIMESTAMPTZ,
  deactivated_by       UUID        REFERENCES profiles(id) ON DELETE SET NULL
);

INSERT INTO adm_emergency_config (id, active)
VALUES ('singleton', false)
ON CONFLICT (id) DO NOTHING;

-- ── Global broadcast messages ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adm_broadcasts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT        NOT NULL,
  body             TEXT        NOT NULL,
  target_type      TEXT        NOT NULL DEFAULT 'all',
  target_value     TEXT,
  channels         TEXT[]      NOT NULL DEFAULT ARRAY['in_app'],
  sent_by          UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  recipients_count INTEGER     NOT NULL DEFAULT 0,
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata         JSONB
);

CREATE INDEX IF NOT EXISTS adm_broadcasts_sent_at_idx ON adm_broadcasts(sent_at DESC);

-- ── System health snapshots ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adm_health_snapshots (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  service     TEXT        NOT NULL,
  status      TEXT        NOT NULL,
  latency_ms  INTEGER,
  details     JSONB,
  checked_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS adm_health_snapshots_service_idx    ON adm_health_snapshots(service);
CREATE INDEX IF NOT EXISTS adm_health_snapshots_checked_at_idx ON adm_health_snapshots(checked_at DESC);

-- ── Admin role definitions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adm_role_definitions (
  role          TEXT    PRIMARY KEY,
  display_name  TEXT    NOT NULL,
  level         INTEGER NOT NULL DEFAULT 0,
  permissions   TEXT[]  NOT NULL DEFAULT '{}',
  country_scope TEXT,
  city_scope    TEXT
);

INSERT INTO adm_role_definitions (role, display_name, level, permissions) VALUES
  ('founder',               'Founder',                100, ARRAY['*']),
  ('global_administrator',  'Global Administrator',    90,  ARRAY['users.*','content.*','flags.*','config.*','monetization.*','security.*','ai.*','countries.*','broadcast.*','audit.read','roles.assign']),
  ('regional_administrator','Regional Administrator',  70,  ARRAY['users.*','content.*','flags.read','config.read','monetization.read','audit.read']),
  ('country_administrator', 'Country Administrator',   60,  ARRAY['users.read','users.suspend','content.*','audit.read']),
  ('city_administrator',    'City Administrator',      50,  ARRAY['users.read','content.read','content.approve','content.reject','audit.read']),
  ('support_manager',       'Support Manager',         40,  ARRAY['users.read','users.suspend','content.read','content.approve','audit.read']),
  ('fraud_manager',         'Fraud Manager',           45,  ARRAY['users.read','users.suspend','users.ban','security.*','audit.*']),
  ('finance_manager',       'Finance Manager',         45,  ARRAY['monetization.*','billing.*','audit.read','users.read']),
  ('content_moderator',     'Content Moderator',       30,  ARRAY['content.*','audit.read']),
  ('ai_administrator',      'AI Administrator',        40,  ARRAY['ai.*','flags.read','audit.read']),
  ('security_administrator','Security Administrator',  45,  ARRAY['security.*','users.read','audit.*']),
  ('developer',             'Developer',               35,  ARRAY['flags.*','config.read','audit.read','health.*','ai.read']),
  ('read_only_auditor',     'Read Only Auditor',       10,  ARRAY['audit.read','stats.read'])
ON CONFLICT (role) DO NOTHING;

-- ── AI command center config ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adm_ai_config (
  id               TEXT        PRIMARY KEY DEFAULT 'singleton',
  model_routing    JSONB       NOT NULL DEFAULT '{}',
  prompt_templates JSONB       NOT NULL DEFAULT '{}',
  cost_limits      JSONB       NOT NULL DEFAULT '{"daily_usd":100,"monthly_usd":3000}',
  features_enabled JSONB       NOT NULL DEFAULT '{}',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by       UUID        REFERENCES profiles(id) ON DELETE SET NULL
);

INSERT INTO adm_ai_config (id, model_routing) VALUES ('singleton', '{
  "chat":          "claude-haiku-4-5-20251001",
  "search":        "claude-haiku-4-5-20251001",
  "recommendations":"claude-sonnet-4-6",
  "analytics":     "claude-sonnet-4-6",
  "fraud":         "claude-sonnet-4-6",
  "document":      "claude-sonnet-4-6"
}')
ON CONFLICT (id) DO NOTHING;

-- ── Founder session tracking ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adm_founder_sessions (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_fingerprint TEXT,
  ip_address         TEXT,
  country            TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active        TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS adm_founder_sessions_user_id_idx ON adm_founder_sessions(user_id);
