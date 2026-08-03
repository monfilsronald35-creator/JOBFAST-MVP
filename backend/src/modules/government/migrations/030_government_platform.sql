-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FAZ 30 — Government Digital Services Platform (migration 030)
-- Prefix: gov_
-- Run manually in Supabase SQL Editor
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── Government agencies ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gov_agencies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,
  country     TEXT NOT NULL DEFAULT 'HT',
  region      TEXT,
  city        TEXT,
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  lat         NUMERIC(10,7),
  lng         NUMERIC(10,7),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Identity verifications ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gov_identity_verifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  document_type   TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  document_no     TEXT,
  verified_at     TIMESTAMPTZ,
  failure_reason  TEXT,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Permits ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gov_permits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id    UUID NOT NULL,
  agency_id     UUID NOT NULL REFERENCES gov_agencies(id),
  type          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft',
  title         TEXT NOT NULL,
  description   TEXT,
  reference_no  TEXT NOT NULL UNIQUE,
  qr_code       TEXT,
  expires_at    TIMESTAMPTZ,
  review_note   TEXT,
  reviewed_by   UUID,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Permit documents ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gov_permit_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id   UUID NOT NULL REFERENCES gov_permits(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Licenses ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gov_licenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holder_id       UUID NOT NULL,
  agency_id       UUID NOT NULL REFERENCES gov_agencies(id),
  type            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active',
  license_no      TEXT NOT NULL UNIQUE,
  holder_name     TEXT NOT NULL,
  qr_code         TEXT,
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  renewed_at      TIMESTAMPTZ,
  suspend_reason  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tax records ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gov_tax_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id       UUID NOT NULL,
  agency_id         UUID NOT NULL REFERENCES gov_agencies(id),
  type              TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',
  period            TEXT NOT NULL,
  base_amount       BIGINT NOT NULL DEFAULT 0,
  tax_amount        BIGINT NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL DEFAULT 'HTG',
  due_date          DATE NOT NULL,
  paid_at           TIMESTAMPTZ,
  payment_ref       TEXT,
  installment_count INTEGER NOT NULL DEFAULT 1,
  receipt_qr        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Certificates ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gov_certificates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id   UUID NOT NULL,
  agency_id      UUID NOT NULL REFERENCES gov_agencies(id),
  type           TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',
  reference_no   TEXT NOT NULL UNIQUE,
  subject_name   TEXT NOT NULL,
  qr_code        TEXT,
  verify_url     TEXT,
  issued_at      TIMESTAMPTZ,
  expires_at     TIMESTAMPTZ,
  delivered_at   TIMESTAMPTZ,
  fee            BIGINT NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'HTG',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Appointments ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gov_appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id      UUID NOT NULL,
  agency_id       UUID NOT NULL REFERENCES gov_agencies(id),
  service_type    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_at    TIMESTAMPTZ NOT NULL,
  confirm_code    TEXT NOT NULL,
  office_address  TEXT,
  notes           TEXT,
  completed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_gov_permits_citizen    ON gov_permits(citizen_id, status);
CREATE INDEX IF NOT EXISTS idx_gov_permits_agency     ON gov_permits(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_gov_licenses_holder    ON gov_licenses(holder_id, status);
CREATE INDEX IF NOT EXISTS idx_gov_licenses_expires   ON gov_licenses(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_gov_tax_taxpayer       ON gov_tax_records(taxpayer_id, period);
CREATE INDEX IF NOT EXISTS idx_gov_tax_status         ON gov_tax_records(status, due_date);
CREATE INDEX IF NOT EXISTS idx_gov_certs_requester    ON gov_certificates(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_gov_appts_citizen      ON gov_appointments(citizen_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_gov_appts_agency       ON gov_appointments(agency_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_gov_identity_user      ON gov_identity_verifications(user_id);

-- ── Seed Haiti government agencies ────────────────────────────────────────────
INSERT INTO gov_agencies (name, type, country, city, address) VALUES
  ('Ministè Finans', 'tax', 'HT', 'Port-au-Prince', 'Palais des Ministères'),
  ('Ofis Nasyonal Idantifikasyon (ONI)', 'civil_registry', 'HT', 'Port-au-Prince', 'Rue des Casernes'),
  ('Ministè Jistis', 'civil_registry', 'HT', 'Port-au-Prince', 'Rue du Centre'),
  ('Direksyon Jeneral Imigrasyon', 'immigration', 'HT', 'Port-au-Prince', 'Biwo Imigrasyon'),
  ('Mairie de Port-au-Prince', 'municipality', 'HT', 'Port-au-Prince', 'Grand Rue'),
  ('Ministè Komès ak Endistri', 'licensing', 'HT', 'Port-au-Prince', 'Boulevard Harry Truman'),
  ('OFATMA (Asi Travay)', 'employment', 'HT', 'Port-au-Prince', 'Rue Berne'),
  ('SMCRS (Transpò)', 'transport', 'HT', 'Port-au-Prince', 'Port-au-Prince')
ON CONFLICT DO NOTHING;