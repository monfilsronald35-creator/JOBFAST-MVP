-- ============================================================
-- Migration 009 — Identity Platform
-- Run manually in Supabase SQL Editor
-- ============================================================

-- Extend profiles with identity type (if column not already present)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'identity_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN identity_type VARCHAR(30) DEFAULT 'customer';
  END IF;
END $$;

-- ——— Sessions —————————————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS identity_sessions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id     UUID,
  session_token TEXT        NOT NULL UNIQUE,
  ip_address    TEXT,
  country_code  VARCHAR(2),
  city          VARCHAR(100),
  browser       VARCHAR(200),
  os            VARCHAR(100),
  app_version   VARCHAR(30),
  login_method  VARCHAR(50) NOT NULL DEFAULT 'email_password',
  risk_score    SMALLINT    NOT NULL DEFAULT 0,
  risk_flags    JSONB       NOT NULL DEFAULT '[]',
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  mfa_verified  BOOLEAN     NOT NULL DEFAULT false,
  expires_at    TIMESTAMPTZ NOT NULL,
  last_active   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_identity_sessions_user_id    ON identity_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_identity_sessions_token      ON identity_sessions (session_token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_identity_sessions_expires    ON identity_sessions (expires_at) WHERE is_active = true;

-- ——— Devices ——————————————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS identity_devices (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id     VARCHAR(255) NOT NULL,
  device_name   VARCHAR(100),
  device_type   VARCHAR(50),
  browser       VARCHAR(200),
  os            VARCHAR(100),
  is_trusted    BOOLEAN     NOT NULL DEFAULT false,
  trust_expires TIMESTAMPTZ,
  fingerprint   TEXT,
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_ip       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_identity_devices_user_id ON identity_devices (user_id);

-- ——— Token revocation (JWT blacklist) ————————————————————————————————————
CREATE TABLE IF NOT EXISTS identity_revoked_tokens (
  jti        TEXT        PRIMARY KEY,
  user_id    UUID        NOT NULL,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason     VARCHAR(100),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_user    ON identity_revoked_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON identity_revoked_tokens (expires_at);

-- ——— MFA credentials ——————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS identity_mfa (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  totp_secret    TEXT,
  totp_enabled   BOOLEAN NOT NULL DEFAULT false,
  totp_verified  BOOLEAN NOT NULL DEFAULT false,
  backup_codes   JSONB   NOT NULL DEFAULT '[]',
  phone_number   VARCHAR(20),
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  passkey_cred   JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ——— Account recovery tokens ——————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS identity_recovery (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash    TEXT        NOT NULL UNIQUE,
  recovery_type VARCHAR(50) NOT NULL,
  metadata      JSONB       NOT NULL DEFAULT '{}',
  expires_at    TIMESTAMPTZ NOT NULL,
  used_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recovery_user    ON identity_recovery (user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_expires ON identity_recovery (expires_at) WHERE used_at IS NULL;

-- ——— Audit log ————————————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS identity_audit_log (
  id         BIGSERIAL   PRIMARY KEY,
  user_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB       NOT NULL DEFAULT '{}',
  ip_address TEXT,
  risk_score SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user    ON identity_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_type    ON identity_audit_log (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON identity_audit_log (created_at DESC);

-- ——— OAuth connections ————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS identity_oauth (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider    VARCHAR(50) NOT NULL,
  provider_id TEXT        NOT NULL,
  email       TEXT,
  raw_profile JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_user ON identity_oauth (user_id);

-- ——— Cleanup job: remove expired revoked tokens (run weekly) —————————————
-- In production, add a pg_cron job:
-- SELECT cron.schedule('weekly-token-cleanup', '0 3 * * 0',
--   'DELETE FROM identity_revoked_tokens WHERE expires_at < NOW()');
