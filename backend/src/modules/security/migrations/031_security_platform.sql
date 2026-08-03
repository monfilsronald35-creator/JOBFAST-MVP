-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FAZ 31 — Global Enterprise Security Platform (migration 031)
-- Prefix: sec_
-- Run manually in Supabase SQL Editor
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── Security audit log ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sec_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  session_id  TEXT,
  action      TEXT NOT NULL,
  target_id   UUID,
  target_type TEXT,
  ip          TEXT NOT NULL DEFAULT '',
  country     TEXT NOT NULL DEFAULT 'HT',
  device_id   TEXT NOT NULL DEFAULT '',
  user_agent  TEXT NOT NULL DEFAULT '',
  result      TEXT NOT NULL DEFAULT 'success',
  risk_score  SMALLINT NOT NULL DEFAULT 0,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS sec_audit_log_2026
  PARTITION OF sec_audit_log
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE IF NOT EXISTS sec_audit_log_2027
  PARTITION OF sec_audit_log
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

-- ── Device intelligence ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sec_devices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,
  device_fingerprint  TEXT NOT NULL,
  user_agent          TEXT NOT NULL DEFAULT '',
  browser             TEXT NOT NULL DEFAULT '',
  os                  TEXT NOT NULL DEFAULT '',
  is_trusted          BOOLEAN NOT NULL DEFAULT false,
  risk_score          SMALLINT NOT NULL DEFAULT 0,
  first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, device_fingerprint)
);

-- ── Security incidents ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sec_incidents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type         TEXT NOT NULL,
  severity     TEXT NOT NULL DEFAULT 'medium',
  user_id      UUID,
  ip           TEXT,
  description  TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open',
  assigned_to  UUID,
  metadata     JSONB NOT NULL DEFAULT '{}',
  resolved_at  TIMESTAMPTZ,
  resolved_by  UUID,
  resolution   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Blocked entities (IP, device, user) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS sec_blocked_entities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type           TEXT NOT NULL,
  value          TEXT NOT NULL,
  reason         TEXT NOT NULL,
  blocked_until  TIMESTAMPTZ,
  created_by     UUID NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (type, value)
);

-- ── Compliance consent records ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sec_consent_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  consent_type TEXT NOT NULL,
  granted      BOOLEAN NOT NULL,
  ip           TEXT NOT NULL DEFAULT '',
  user_agent   TEXT NOT NULL DEFAULT '',
  granted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sec_audit_user    ON sec_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_audit_action  ON sec_audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_audit_ip      ON sec_audit_log(ip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_audit_risk    ON sec_audit_log(risk_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_devices_user  ON sec_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_sec_devices_fp    ON sec_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_sec_incidents_st  ON sec_incidents(status, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_blocked_val   ON sec_blocked_entities(type, value);
CREATE INDEX IF NOT EXISTS idx_sec_consent_user  ON sec_consent_records(user_id, consent_type);