-- ─────────────────────────────────────────────────────────────────────────────
-- FAZ 18 — Payment Orchestrator (Global Payment Intelligence Engine)
-- Migration 014 | Prefix: pay_
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Provider Configuration Registry ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS pay_provider_configs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL UNIQUE,
  category              TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'active',
  supported_countries   TEXT[] NOT NULL DEFAULT '{}',
  supported_currencies  TEXT[] NOT NULL DEFAULT '{}',
  supported_methods     TEXT[] NOT NULL DEFAULT '{}',
  fee_percentage        BIGINT NOT NULL DEFAULT 0,
  flat_fee              BIGINT NOT NULL DEFAULT 0,
  avg_success_rate      NUMERIC(5,2) NOT NULL DEFAULT 95.00,
  avg_latency_ms        INTEGER NOT NULL DEFAULT 500,
  priority              INTEGER NOT NULL DEFAULT 10,
  config                JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Payment Intents ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pay_payment_intents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id),
  amount                BIGINT NOT NULL CHECK (amount > 0),
  currency              TEXT NOT NULL,
  method                TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending',
  description           TEXT NOT NULL DEFAULT '',
  provider              TEXT,
  provider_intent_id    TEXT,
  client_secret         TEXT,
  requires_3ds          BOOLEAN NOT NULL DEFAULT FALSE,
  risk_score            INTEGER NOT NULL DEFAULT 0,
  order_id              UUID,
  job_id                UUID,
  escrow_id             UUID,
  subscription_id       UUID,
  split_rule_id         UUID,
  ip_address            TEXT,
  device_id             TEXT,
  country               TEXT,
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pay_intents_user ON pay_payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_pay_intents_status ON pay_payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_pay_intents_order ON pay_payment_intents(order_id) WHERE order_id IS NOT NULL;

-- ── 3. Provider Transactions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pay_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id             UUID NOT NULL REFERENCES pay_payment_intents(id),
  provider              TEXT NOT NULL,
  provider_tx_id        TEXT,
  amount                BIGINT NOT NULL,
  fee                   BIGINT NOT NULL DEFAULT 0,
  currency              TEXT NOT NULL,
  status                TEXT NOT NULL,
  attempt               SMALLINT NOT NULL DEFAULT 1,
  error_code            TEXT,
  error_message         TEXT,
  raw_response          JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pay_txns_intent ON pay_transactions(intent_id);
CREATE INDEX IF NOT EXISTS idx_pay_txns_provider ON pay_transactions(provider);

-- ── 4. Route Decision Logs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pay_route_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id             UUID NOT NULL REFERENCES pay_payment_intents(id),
  selected_provider     TEXT NOT NULL,
  candidates            JSONB NOT NULL DEFAULT '[]',
  reason                TEXT NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. Split Rules ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pay_split_rules (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL UNIQUE,
  context               TEXT NOT NULL,
  entries               JSONB NOT NULL DEFAULT '[]',
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. Split Entries ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pay_split_entries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id             UUID NOT NULL REFERENCES pay_payment_intents(id),
  split_rule_id         UUID REFERENCES pay_split_rules(id),
  recipient             TEXT NOT NULL,
  amount                BIGINT NOT NULL,
  currency              TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pay_splits_intent ON pay_split_entries(intent_id);

-- ── 7. Refunds ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pay_refunds (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id             UUID NOT NULL REFERENCES pay_payment_intents(id),
  user_id               UUID NOT NULL REFERENCES profiles(id),
  amount                BIGINT NOT NULL CHECK (amount > 0),
  currency              TEXT NOT NULL,
  reason                TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending',
  provider_refund_id    TEXT,
  processed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pay_refunds_intent ON pay_refunds(intent_id);

-- ── 8. Subscriptions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pay_subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id),
  provider              TEXT NOT NULL,
  provider_sub_id       TEXT,
  plan_id               TEXT,
  status                TEXT NOT NULL DEFAULT 'active',
  interval              TEXT NOT NULL,
  amount                BIGINT NOT NULL,
  currency              TEXT NOT NULL,
  current_period_start  TIMESTAMPTZ NOT NULL,
  current_period_end    TIMESTAMPTZ NOT NULL,
  trial_ends_at         TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pay_subs_user ON pay_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_pay_subs_status ON pay_subscriptions(status);

-- ── 9. Webhook Events ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pay_webhooks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider              TEXT NOT NULL,
  event_type            TEXT NOT NULL,
  payload               JSONB NOT NULL DEFAULT '{}',
  processed             BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pay_webhooks_unprocessed ON pay_webhooks(processed, created_at) WHERE processed = FALSE;

-- ── 10. 3DS Sessions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pay_3ds_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id             UUID NOT NULL REFERENCES pay_payment_intents(id),
  method                TEXT NOT NULL,  -- 'otp', 'face_id', 'fingerprint', 'pin'
  challenge_data        JSONB NOT NULL DEFAULT '{}',
  verified              BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at            TIMESTAMPTZ NOT NULL,
  verified_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Seed: Default Provider Configurations ─────────────────────────────────────
INSERT INTO pay_provider_configs (name, category, supported_countries, supported_currencies, supported_methods, fee_percentage, flat_fee, avg_success_rate, avg_latency_ms, priority) VALUES
  ('stripe',       'online_gateway',  ARRAY['US','CA','GB','AU','FR','DE','IT','ES','NL','JP','BR','SG','HK'], ARRAY['USD','EUR','GBP','CAD','AUD','JPY','BRL'],   ARRAY['card','wallet','bank'],                  290,   30,  98.5,  800,  1),
  ('paypal',       'online_gateway',  ARRAY['US','CA','GB','AU','FR','DE','IT','ES','NL','BR','MX'],           ARRAY['USD','EUR','GBP','CAD','AUD','BRL','MXN'],   ARRAY['wallet','card','bank'],                  349,    0,  97.0, 1200,  2),
  ('adyen',        'online_gateway',  ARRAY['US','CA','GB','AU','FR','DE','IT','ES','NL','SE','DK','NO'],      ARRAY['USD','EUR','GBP','SEK','DKK','NOK'],         ARRAY['card','wallet','bank'],                  270,   20,  99.0,  600,  1),
  ('checkout',     'online_gateway',  ARRAY['US','CA','GB','FR','DE','IT','ES','AE','SA','KW'],                ARRAY['USD','EUR','GBP','AED','SAR'],               ARRAY['card','wallet'],                         290,   20,  97.5,  700,  2),
  ('braintree',    'online_gateway',  ARRAY['US','CA','GB','AU','BR','MX'],                                    ARRAY['USD','EUR','GBP','CAD','AUD','BRL','MXN'],   ARRAY['card','wallet','paypal'],                290,    0,  97.0,  900,  3),
  ('moncash',      'mobile_money',    ARRAY['HT'],                                                             ARRAY['HTG','USD'],                                 ARRAY['mobile_money','qr_code'],               200,    0,  95.0, 3000,  1),
  ('natcash',      'mobile_money',    ARRAY['HT'],                                                             ARRAY['HTG'],                                       ARRAY['mobile_money'],                          250,    0,  93.0, 3500,  2),
  ('m_pesa',       'mobile_money',    ARRAY['KE','TZ','UG','RW','MZ','GH'],                                   ARRAY['KES','TZS','UGX','RWF','MZN','GHS'],        ARRAY['mobile_money','qr_code'],               100,    0,  97.0, 2000,  1),
  ('orange_money', 'mobile_money',    ARRAY['CI','SN','ML','CM','MG','BF'],                                   ARRAY['XOF','XAF','MGA'],                          ARRAY['mobile_money'],                          200,    0,  94.0, 2500,  1),
  ('mtn_momo',     'mobile_money',    ARRAY['NG','GH','UG','RW','CI','CM','ZM'],                              ARRAY['NGN','GHS','UGX','RWF','XOF','XAF','ZMW'],  ARRAY['mobile_money'],                          200,    0,  95.0, 2200,  1),
  ('airtel_money', 'mobile_money',    ARRAY['KE','TZ','UG','RW','NG','ZM','MG'],                              ARRAY['KES','TZS','UGX','RWF','NGN','ZMW','MGA'],  ARRAY['mobile_money'],                          200,    0,  94.0, 2400,  2),
  ('digicel',      'telecom',         ARRAY['HT','JM','BB','TT','GY','FJ'],                                   ARRAY['HTG','JMD','BBD','TTD','GYD','FJD'],        ARRAY['mobile_money','telecom'],               300,    0,  90.0, 4000,  3),
  ('open_banking', 'banking',         ARRAY['GB','FR','DE','IT','ES','NL','SE','DK','NO','FI'],               ARRAY['GBP','EUR','SEK','DKK','NOK'],               ARRAY['bank'],                                  100,    0,  98.0, 1500,  1),
  ('sepa',         'banking',         ARRAY['FR','DE','IT','ES','NL','SE','DK','NO','FI','AT','BE','PT'],     ARRAY['EUR'],                                       ARRAY['bank'],                                   50,    0,  99.0, 2000,  1),
  ('ach',          'banking',         ARRAY['US'],                                                             ARRAY['USD'],                                       ARRAY['bank'],                                   50,    0,  99.0, 2000,  1),
  ('bitcoin',      'crypto',          ARRAY['*'],                                                              ARRAY['BTC'],                                       ARRAY['crypto'],                               100,    0,  95.0, 5000,  1),
  ('usdt',         'crypto',          ARRAY['*'],                                                              ARRAY['USDT'],                                      ARRAY['crypto'],                               100,    0,  97.0, 3000,  1),
  ('usdc',         'crypto',          ARRAY['*'],                                                              ARRAY['USDC'],                                      ARRAY['crypto'],                               100,    0,  97.0, 3000,  2)
ON CONFLICT (name) DO NOTHING;

-- ── Default split rules ────────────────────────────────────────────────────────
INSERT INTO pay_split_rules (name, context, entries) VALUES
  ('marketplace_standard', 'marketplace', '[{"recipient":"seller","percentage":9000},{"recipient":"platform","percentage":800},{"recipient":"tax","percentage":200}]'),
  ('jobs_standard',        'jobs',        '[{"recipient":"worker","percentage":8500},{"recipient":"platform","percentage":1200},{"recipient":"tax","percentage":300}]'),
  ('rental_standard',      'rental',      '[{"recipient":"host","percentage":8700},{"recipient":"platform","percentage":1000},{"recipient":"tax","percentage":300}]')
ON CONFLICT (name) DO NOTHING;
