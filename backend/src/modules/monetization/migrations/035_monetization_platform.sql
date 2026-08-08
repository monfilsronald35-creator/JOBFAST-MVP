-- Migration 035: Global Monetization & Revenue Platform (FAZ 22)
-- Run manually in Supabase SQL Editor

-- ── Global config (singleton row) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mon_config (
  id             TEXT PRIMARY KEY DEFAULT 'singleton',
  global_enabled BOOLEAN      NOT NULL DEFAULT false,
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_by     UUID         REFERENCES profiles(id) ON DELETE SET NULL
);

-- ── Per-service toggles ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mon_service_config (
  service     TEXT         PRIMARY KEY,
  enabled     BOOLEAN      NOT NULL DEFAULT false,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_by  UUID         REFERENCES profiles(id) ON DELETE SET NULL
);

-- ── Dynamic fee rules ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mon_fee_rules (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  service      TEXT        NOT NULL,
  country      TEXT,
  city         TEXT,
  user_type    TEXT,
  volume_min   INTEGER,
  volume_max   INTEGER,
  rate_percent NUMERIC(8,4),
  fixed_amount BIGINT,
  currency     TEXT,
  priority     INTEGER     NOT NULL DEFAULT 0,
  active       BOOLEAN     NOT NULL DEFAULT true,
  label        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID        REFERENCES profiles(id) ON DELETE SET NULL
);

-- ── Free tier strategies ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mon_free_tier_strategies (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  strategy_type  TEXT        NOT NULL,
  value          NUMERIC,
  currency       TEXT,
  user_types     TEXT[],
  service        TEXT,
  active         BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by     UUID        REFERENCES profiles(id) ON DELETE SET NULL
);

-- ── Revenue events ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mon_revenue_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  service         TEXT        NOT NULL,
  transaction_ref TEXT,
  original_amount BIGINT      NOT NULL,
  fee_amount      BIGINT      NOT NULL DEFAULT 0,
  total_amount    BIGINT      NOT NULL,
  currency        TEXT        NOT NULL DEFAULT 'HTG',
  country         TEXT,
  city            TEXT,
  user_type       TEXT,
  rule_id         UUID        REFERENCES mon_fee_rules(id) ON DELETE SET NULL,
  is_free         BOOLEAN     NOT NULL DEFAULT false,
  free_reason     TEXT,
  status          TEXT        NOT NULL DEFAULT 'collected',
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Invoices ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mon_invoices (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT        UNIQUE NOT NULL,
  user_id        UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  type           TEXT        NOT NULL,
  service        TEXT,
  period_start   TIMESTAMPTZ,
  period_end     TIMESTAMPTZ,
  subtotal       BIGINT      NOT NULL,
  tax_amount     BIGINT      NOT NULL DEFAULT 0,
  total          BIGINT      NOT NULL,
  currency       TEXT        NOT NULL DEFAULT 'HTG',
  status         TEXT        NOT NULL DEFAULT 'draft',
  line_items     JSONB       NOT NULL DEFAULT '[]',
  metadata       JSONB,
  issued_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at         TIMESTAMPTZ,
  paid_at        TIMESTAMPTZ
);

-- ── Announcements ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mon_announcements (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type             TEXT        NOT NULL,
  title            TEXT        NOT NULL,
  body             TEXT        NOT NULL,
  services         TEXT[],
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_by          UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  recipients_count INTEGER     NOT NULL DEFAULT 0,
  metadata         JSONB
);

-- ── Welcome modal tracking ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mon_user_modal_seen (
  user_id  UUID        PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  seen_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS mon_revenue_events_user_id_idx   ON mon_revenue_events(user_id);
CREATE INDEX IF NOT EXISTS mon_revenue_events_service_idx   ON mon_revenue_events(service);
CREATE INDEX IF NOT EXISTS mon_revenue_events_created_at_idx ON mon_revenue_events(created_at DESC);
CREATE INDEX IF NOT EXISTS mon_revenue_events_country_idx   ON mon_revenue_events(country);
CREATE INDEX IF NOT EXISTS mon_fee_rules_service_idx        ON mon_fee_rules(service);
CREATE INDEX IF NOT EXISTS mon_fee_rules_priority_idx       ON mon_fee_rules(priority DESC);
CREATE INDEX IF NOT EXISTS mon_invoices_user_id_idx         ON mon_invoices(user_id);
CREATE INDEX IF NOT EXISTS mon_invoices_issued_at_idx       ON mon_invoices(issued_at DESC);

-- ── Seed: singleton config (monetization OFF at launch) ───────────────────────
INSERT INTO mon_config (id, global_enabled)
VALUES ('singleton', false)
ON CONFLICT (id) DO NOTHING;

-- ── Seed: all services disabled ───────────────────────────────────────────────
INSERT INTO mon_service_config (service, enabled) VALUES
  ('jobs',             false),
  ('marketplace',      false),
  ('wallet',           false),
  ('hotels',           false),
  ('flights',          false),
  ('telecom',          false),
  ('healthcare',       false),
  ('government',       false),
  ('enterprise',       false),
  ('ai_premium',       false),
  ('subscriptions',    false),
  ('featured_listings',false),
  ('api_partner',      false),
  ('affiliate',        false)
ON CONFLICT (service) DO NOTHING;

-- ── Seed: example fee rules (inactive — admin activates them) ─────────────────
INSERT INTO mon_fee_rules (service, country, rate_percent, priority, active, label) VALUES
  ('marketplace', NULL, 2.0,  10, false, 'Marketplace default 2%'),
  ('marketplace', 'HT', 1.0,  20, false, 'Marketplace Haiti 1%'),
  ('marketplace', 'DO', 2.0,  20, false, 'Marketplace Dominican Republic 2%'),
  ('marketplace', 'US', 3.0,  20, false, 'Marketplace USA 3%'),
  ('marketplace', 'FR', 4.0,  20, false, 'Marketplace France 4%'),
  ('marketplace', NULL, 0.0,  30, false, 'Marketplace free: first 100 transactions (volume rule)'),
  ('hotels',      NULL, 5.0,  10, false, 'Hotels default 5%'),
  ('flights',     NULL, 3.0,  10, false, 'Flights default 3%'),
  ('wallet',      NULL, 1.0,  10, false, 'Wallet transfer 1%'),
  ('wallet',      NULL, 0.5,  20, false, 'Wallet recharge 0.5%'),
  ('telecom',     NULL, 1.0,  10, false, 'Telecom default 1%'),
  ('healthcare',  NULL, 2.0,  10, false, 'Healthcare default 2%'),
  ('enterprise',  NULL, 0.0,  10, false, 'Enterprise subscription-based'),
  ('ai_premium',  NULL, 0.0,  10, false, 'AI Premium subscription-based'),
  ('jobs',        NULL, 0.0,  10, false, 'Jobs free for workers')
;

-- Volume-based rules for marketplace
UPDATE mon_fee_rules
SET volume_min = 0, volume_max = 100
WHERE label = 'Marketplace free: first 100 transactions (volume rule)';

-- User-type rules
INSERT INTO mon_fee_rules (service, user_type, rate_percent, priority, active, label) VALUES
  ('marketplace', 'worker',     0.0, 50, false, 'Marketplace: workers free'),
  ('marketplace', 'ngo',        0.0, 50, false, 'Marketplace: NGO free'),
  ('marketplace', 'government', 0.0, 50, false, 'Marketplace: government free'),
  ('marketplace', 'company',    2.0, 40, false, 'Marketplace: company 2%'),
  ('marketplace', 'enterprise', 0.0, 40, false, 'Marketplace: enterprise (subscription)'),
  ('marketplace', 'hotel',      5.0, 40, false, 'Marketplace: hotel 5%'),
  ('marketplace', 'restaurant', 2.0, 40, false, 'Marketplace: restaurant 2%')
;

-- ── Seed: free tier strategies ────────────────────────────────────────────────
INSERT INTO mon_free_tier_strategies (name, strategy_type, value, active) VALUES
  ('Launch Period — 90 days free', 'days', 90, true)
;

INSERT INTO mon_free_tier_strategies (name, strategy_type, user_types, active) VALUES
  ('NGO & Government Always Free', 'user_type', ARRAY['ngo', 'government'], true)
;