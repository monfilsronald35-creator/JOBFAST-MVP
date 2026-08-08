-- Migration 037: Global Integration Platform (FAZ 24)
-- Run manually in Supabase SQL Editor.

-- ── Partner registry ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS int_partners (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT         NOT NULL,
  type            TEXT         NOT NULL DEFAULT 'developer',
  tier            TEXT         NOT NULL DEFAULT 'standard',
  status          TEXT         NOT NULL DEFAULT 'active',
  country         TEXT,
  contact_email   TEXT,
  website         TEXT,
  allowed_scopes  TEXT[]       NOT NULL DEFAULT '{}',
  webhook_url     TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_by      UUID         REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS int_partners_type_idx   ON int_partners(type);
CREATE INDEX IF NOT EXISTS int_partners_status_idx ON int_partners(status);

-- ── API keys ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS int_api_keys (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id        UUID        NOT NULL REFERENCES int_partners(id) ON DELETE CASCADE,
  key_hash          TEXT        NOT NULL UNIQUE,
  key_prefix        TEXT        NOT NULL,
  name              TEXT        NOT NULL,
  scopes            TEXT[]      NOT NULL DEFAULT '{}',
  rate_limit_per_min  INTEGER   NOT NULL DEFAULT 60,
  rate_limit_per_day  INTEGER   NOT NULL DEFAULT 10000,
  active            BOOLEAN     NOT NULL DEFAULT true,
  expires_at        TIMESTAMPTZ,
  last_used_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID        REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS int_api_keys_partner_id_idx ON int_api_keys(partner_id);
CREATE INDEX IF NOT EXISTS int_api_keys_key_hash_idx   ON int_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS int_api_keys_active_idx     ON int_api_keys(active);

-- ── Webhooks ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS int_webhooks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID        NOT NULL REFERENCES int_partners(id) ON DELETE CASCADE,
  url         TEXT        NOT NULL,
  secret      TEXT        NOT NULL,
  events      TEXT[]      NOT NULL DEFAULT '{}',
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS int_webhooks_partner_id_idx ON int_webhooks(partner_id);

-- ── Webhook deliveries ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS int_webhook_deliveries (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id      UUID        NOT NULL REFERENCES int_webhooks(id) ON DELETE CASCADE,
  event_name      TEXT        NOT NULL,
  payload         JSONB       NOT NULL DEFAULT '{}',
  response_status INTEGER,
  response_body   TEXT,
  attempt_count   INTEGER     NOT NULL DEFAULT 1,
  status          TEXT        NOT NULL DEFAULT 'pending',
  next_retry_at   TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS int_webhook_deliveries_webhook_id_idx  ON int_webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS int_webhook_deliveries_status_idx      ON int_webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS int_webhook_deliveries_created_at_idx  ON int_webhook_deliveries(created_at DESC);

-- ── OAuth2 clients ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS int_oauth_clients (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           TEXT        NOT NULL UNIQUE,
  client_secret_hash  TEXT        NOT NULL,
  name                TEXT        NOT NULL,
  redirect_uris       TEXT[]      NOT NULL DEFAULT '{}',
  allowed_scopes      TEXT[]      NOT NULL DEFAULT '{}',
  grant_types         TEXT[]      NOT NULL DEFAULT ARRAY['authorization_code'],
  partner_id          UUID        REFERENCES int_partners(id) ON DELETE CASCADE,
  active              BOOLEAN     NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── OAuth2 authorization codes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS int_oauth_codes (
  code          TEXT        PRIMARY KEY,
  client_id     TEXT        NOT NULL,
  user_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scopes        TEXT[]      NOT NULL DEFAULT '{}',
  redirect_uri  TEXT        NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  used          BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS int_oauth_codes_client_id_idx ON int_oauth_codes(client_id);
-- Cleanup: codes expire in 10 minutes

-- ── API usage logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS int_usage_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id   UUID        REFERENCES int_api_keys(id) ON DELETE SET NULL,
  partner_id   UUID        REFERENCES int_partners(id) ON DELETE SET NULL,
  endpoint     TEXT        NOT NULL,
  method       TEXT        NOT NULL DEFAULT 'GET',
  status_code  INTEGER,
  latency_ms   INTEGER,
  ip_address   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS int_usage_logs_partner_id_idx  ON int_usage_logs(partner_id);
CREATE INDEX IF NOT EXISTS int_usage_logs_created_at_idx  ON int_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS int_usage_logs_api_key_id_idx  ON int_usage_logs(api_key_id);
