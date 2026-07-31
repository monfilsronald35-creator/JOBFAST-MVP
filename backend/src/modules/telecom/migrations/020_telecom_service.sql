-- ============================================================
-- FAZ 24 — Telecom Service
-- Migration: 020_telecom_service.sql
-- Run manually in Supabase SQL Editor
-- Prefix: tel_
-- ============================================================

-- ── Operators ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tel_operators (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  code       TEXT NOT NULL UNIQUE,
  country    TEXT NOT NULL DEFAULT 'HT',
  currency   TEXT NOT NULL DEFAULT 'HTG',
  logo_url   TEXT,
  website    TEXT,
  api_type   TEXT NOT NULL DEFAULT 'rest'
               CHECK (api_type IN ('rest','soap','ussd','mock')),
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  owner_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tel_ops_owner    ON tel_operators(owner_id);
CREATE INDEX IF NOT EXISTS idx_tel_ops_country  ON tel_operators(country);
CREATE INDEX IF NOT EXISTS idx_tel_ops_active   ON tel_operators(is_active);

-- ── Operator Configs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tel_operator_configs (
  operator_id      UUID PRIMARY KEY REFERENCES tel_operators(id) ON DELETE CASCADE,
  api_base_url     TEXT NOT NULL DEFAULT '',
  api_key          TEXT,
  api_secret       TEXT,
  webhook_url      TEXT,
  timeout_ms       INTEGER NOT NULL DEFAULT 30000,
  retry_attempts   INTEGER NOT NULL DEFAULT 3,
  rate_limit_rpm   INTEGER NOT NULL DEFAULT 60,
  sandbox_mode     BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Bundles ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tel_bundles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id   UUID NOT NULL REFERENCES tel_operators(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  code          TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'combo'
                  CHECK (type IN ('internet','minutes','sms','roaming','international',
                                  'streaming','gaming','business','family','student',
                                  'night','unlimited','combo')),
  description   TEXT NOT NULL DEFAULT '',
  price         BIGINT NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'HTG',
  validity_days INTEGER NOT NULL DEFAULT 30,
  data_gb       NUMERIC(10,2),
  minutes_mins  INTEGER,
  sms_count     INTEGER,
  speed         TEXT,
  coverage      TEXT,
  bonus         TEXT,
  is_renewable  BOOLEAN NOT NULL DEFAULT TRUE,
  countries     TEXT[] NOT NULL DEFAULT '{}',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(operator_id, code)
);

CREATE INDEX IF NOT EXISTS idx_tel_bun_op      ON tel_bundles(operator_id);
CREATE INDEX IF NOT EXISTS idx_tel_bun_type    ON tel_bundles(type);
CREATE INDEX IF NOT EXISTS idx_tel_bun_active  ON tel_bundles(is_active);
CREATE INDEX IF NOT EXISTS idx_tel_bun_price   ON tel_bundles(price);

-- ── Recharges ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tel_recharges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id   UUID NOT NULL REFERENCES tel_operators(id) ON DELETE RESTRICT,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  dealer_id     UUID,
  type          TEXT NOT NULL DEFAULT 'prepaid'
                  CHECK (type IN ('prepaid','postpaid','international','gift',
                                  'scheduled','auto','family','emergency')),
  phone         TEXT NOT NULL,
  amount        BIGINT NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'HTG',
  bundle_id     UUID REFERENCES tel_bundles(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','processing','completed','failed','refunded','cancelled')),
  external_ref  TEXT,
  fail_reason   TEXT,
  scheduled_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  refunded_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tel_rch_op      ON tel_recharges(operator_id);
CREATE INDEX IF NOT EXISTS idx_tel_rch_user    ON tel_recharges(user_id);
CREATE INDEX IF NOT EXISTS idx_tel_rch_dealer  ON tel_recharges(dealer_id);
CREATE INDEX IF NOT EXISTS idx_tel_rch_status  ON tel_recharges(status);
CREATE INDEX IF NOT EXISTS idx_tel_rch_phone   ON tel_recharges(phone);
CREATE INDEX IF NOT EXISTS idx_tel_rch_ts      ON tel_recharges(created_at DESC);

-- ── SIM Cards ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tel_sims (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id   UUID NOT NULL REFERENCES tel_operators(id) ON DELETE RESTRICT,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  iccid         TEXT NOT NULL UNIQUE,
  msisdn        TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'physical' CHECK (type IN ('physical','esim')),
  status        TEXT NOT NULL DEFAULT 'unregistered'
                  CHECK (status IN ('unregistered','registered','active','suspended','terminated')),
  kyc_status    TEXT NOT NULL DEFAULT 'pending'
                  CHECK (kyc_status IN ('pending','verified','rejected')),
  activated_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  country       TEXT NOT NULL DEFAULT 'HT',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tel_sim_op      ON tel_sims(operator_id);
CREATE INDEX IF NOT EXISTS idx_tel_sim_user    ON tel_sims(user_id);
CREATE INDEX IF NOT EXISTS idx_tel_sim_msisdn  ON tel_sims(msisdn);

-- ── Bills ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tel_bills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES tel_operators(id) ON DELETE RESTRICT,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  phone       TEXT NOT NULL,
  period      TEXT NOT NULL,
  amount      BIGINT NOT NULL DEFAULT 0,
  currency    TEXT NOT NULL DEFAULT 'HTG',
  due_date    DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','paid','overdue','partial','cancelled')),
  paid_at     TIMESTAMPTZ,
  late_fee    BIGINT DEFAULT 0,
  items       JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(operator_id, user_id, phone, period)
);

CREATE INDEX IF NOT EXISTS idx_tel_bill_op     ON tel_bills(operator_id);
CREATE INDEX IF NOT EXISTS idx_tel_bill_user   ON tel_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_tel_bill_status ON tel_bills(status);

-- ── Dealers ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tel_dealers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id    UUID NOT NULL REFERENCES tel_operators(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  name           TEXT NOT NULL,
  code           TEXT NOT NULL,
  tier           TEXT NOT NULL DEFAULT 'agent'
                   CHECK (tier IN ('platinum','gold','silver','bronze','agent')),
  country        TEXT NOT NULL DEFAULT 'HT',
  city           TEXT NOT NULL DEFAULT '',
  phone          TEXT NOT NULL DEFAULT '',
  email          TEXT,
  manager_id     UUID REFERENCES tel_dealers(id) ON DELETE SET NULL,
  wallet_balance BIGINT NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'HTG',
  status         TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','suspended','terminated')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(operator_id, code)
);

CREATE INDEX IF NOT EXISTS idx_tel_dlr_op      ON tel_dealers(operator_id);
CREATE INDEX IF NOT EXISTS idx_tel_dlr_user    ON tel_dealers(user_id);
CREATE INDEX IF NOT EXISTS idx_tel_dlr_mgr     ON tel_dealers(manager_id);
CREATE INDEX IF NOT EXISTS idx_tel_dlr_status  ON tel_dealers(status);

-- ── Commissions ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tel_commissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id  UUID NOT NULL REFERENCES tel_operators(id) ON DELETE CASCADE,
  dealer_id    UUID NOT NULL REFERENCES tel_dealers(id) ON DELETE CASCADE,
  type         TEXT NOT NULL DEFAULT 'recharge'
                 CHECK (type IN ('recharge','bundle','sim_activation','referral','campaign','monthly_bonus')),
  recharge_id  UUID REFERENCES tel_recharges(id) ON DELETE SET NULL,
  base_amount  BIGINT NOT NULL DEFAULT 0,
  rate         NUMERIC(5,2) NOT NULL DEFAULT 0,
  amount       BIGINT NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'HTG',
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','paid','reversed')),
  paid_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tel_com_op      ON tel_commissions(operator_id);
CREATE INDEX IF NOT EXISTS idx_tel_com_dealer  ON tel_commissions(dealer_id);
CREATE INDEX IF NOT EXISTS idx_tel_com_status  ON tel_commissions(status);

-- ── Commission Rules ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tel_commission_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id  UUID NOT NULL REFERENCES tel_operators(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  dealer_tier  TEXT NOT NULL,
  rate_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  min_amount   BIGINT NOT NULL DEFAULT 0,
  bonus_amount BIGINT DEFAULT 0,
  UNIQUE(operator_id, type, dealer_tier)
);

CREATE INDEX IF NOT EXISTS idx_tel_crules_op   ON tel_commission_rules(operator_id);

-- ── Fraud Events ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tel_fraud_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES tel_operators(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  dealer_id   UUID REFERENCES tel_dealers(id) ON DELETE SET NULL,
  type        TEXT NOT NULL
                CHECK (type IN ('fake_recharge','duplicate_payment','bot_activity',
                                'sim_fraud','account_abuse','dealer_fraud')),
  risk_score  INTEGER NOT NULL DEFAULT 0,
  details     JSONB NOT NULL DEFAULT '{}',
  action      TEXT NOT NULL DEFAULT 'flagged'
                CHECK (action IN ('flagged','blocked','reviewed','cleared')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tel_frd_op      ON tel_fraud_events(operator_id);
CREATE INDEX IF NOT EXISTS idx_tel_frd_user    ON tel_fraud_events(user_id);
CREATE INDEX IF NOT EXISTS idx_tel_frd_ts      ON tel_fraud_events(created_at DESC);

-- ── Retry Queue ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tel_retry_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id   UUID NOT NULL REFERENCES tel_operators(id) ON DELETE CASCADE,
  recharge_id   UUID NOT NULL REFERENCES tel_recharges(id) ON DELETE CASCADE,
  attempts      INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error    TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tel_retry_op    ON tel_retry_queue(operator_id);
CREATE INDEX IF NOT EXISTS idx_tel_retry_next  ON tel_retry_queue(next_retry_at);

-- ── Seed well-known operators (sandbox/mock by default) ───────────────────────
-- These require a real owner_id; insert after creating your admin profile.
-- INSERT INTO tel_operators(name, code, country, currency, api_type, is_active, owner_id) VALUES
--   ('Digicel Haiti',   'DIGICEL_HT',  'HT', 'HTG', 'mock', true, '<admin-uuid>'),
--   ('Claro RD',        'CLARO_DO',    'DO', 'DOP', 'mock', true, '<admin-uuid>'),
--   ('Altice RD',       'ALTICE_DO',   'DO', 'DOP', 'mock', true, '<admin-uuid>'),
--   ('Orange France',   'ORANGE_FR',   'FR', 'EUR', 'mock', true, '<admin-uuid>'),
--   ('MTN Nigeria',     'MTN_NG',      'NG', 'NGN', 'mock', true, '<admin-uuid>'),
--   ('Safaricom Kenya', 'SAFARICOM_KE','KE', 'KES', 'mock', true, '<admin-uuid>');