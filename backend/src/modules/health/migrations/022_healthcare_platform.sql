-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FAZ 26 — Healthcare Platform (migration 022)
-- Prefix: hc_
-- Run manually in Supabase SQL Editor
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── Facilities (Hospitals, Clinics, Labs, Pharmacies...) ──────────────────────
CREATE TABLE IF NOT EXISTS hc_facilities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'clinic',
  country     TEXT NOT NULL DEFAULT 'HT',
  city        TEXT NOT NULL,
  address     TEXT NOT NULL DEFAULT '',
  lat         NUMERIC(10,7),
  lng         NUMERIC(10,7),
  phone       TEXT NOT NULL DEFAULT '',
  email       TEXT,
  website     TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  currency    TEXT NOT NULL DEFAULT 'HTG',
  rating      NUMERIC(3,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Patients ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hc_patients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,
  patient_id          TEXT NOT NULL UNIQUE,
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  date_of_birth       DATE NOT NULL,
  gender              TEXT NOT NULL DEFAULT 'other',
  blood_type          TEXT,
  country             TEXT NOT NULL DEFAULT 'HT',
  city                TEXT NOT NULL DEFAULT '',
  phone               TEXT NOT NULL DEFAULT '',
  email               TEXT,
  allergies           JSONB NOT NULL DEFAULT '[]',
  conditions          JSONB NOT NULL DEFAULT '[]',
  medications         JSONB NOT NULL DEFAULT '[]',
  vaccinations        JSONB NOT NULL DEFAULT '[]',
  emergency_contacts  JSONB NOT NULL DEFAULT '[]',
  insurance_id        UUID,
  preferred_language  TEXT NOT NULL DEFAULT 'ht',
  primary_doctor_id   UUID,
  consent_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Doctors ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hc_doctors (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL,
  facility_id            UUID REFERENCES hc_facilities(id),
  first_name             TEXT NOT NULL,
  last_name              TEXT NOT NULL,
  specialty              TEXT NOT NULL,
  license_number         TEXT NOT NULL UNIQUE,
  country                TEXT NOT NULL DEFAULT 'HT',
  city                   TEXT NOT NULL DEFAULT '',
  phone                  TEXT NOT NULL DEFAULT '',
  email                  TEXT,
  languages              JSONB NOT NULL DEFAULT '["ht", "fr"]',
  experience             INT NOT NULL DEFAULT 0,
  consultation_fee       BIGINT NOT NULL DEFAULT 0,
  currency               TEXT NOT NULL DEFAULT 'HTG',
  telemedicine_available BOOLEAN NOT NULL DEFAULT false,
  rating                 NUMERIC(3,2) NOT NULL DEFAULT 5.0,
  review_count           INT NOT NULL DEFAULT 0,
  is_verified            BOOLEAN NOT NULL DEFAULT false,
  is_active              BOOLEAN NOT NULL DEFAULT true,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hc_doctor_schedules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id    UUID NOT NULL REFERENCES hc_doctors(id) ON DELETE CASCADE,
  day_of_week  INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TEXT NOT NULL DEFAULT '08:00',
  end_time     TEXT NOT NULL DEFAULT '17:00',
  slot_minutes INT NOT NULL DEFAULT 30,
  is_active    BOOLEAN NOT NULL DEFAULT true
);

-- ── Appointments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hc_appointments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL,
  doctor_id     UUID NOT NULL,
  facility_id   UUID REFERENCES hc_facilities(id),
  type          TEXT NOT NULL DEFAULT 'online',
  status        TEXT NOT NULL DEFAULT 'pending',
  scheduled_at  TIMESTAMPTZ NOT NULL,
  duration      INT NOT NULL DEFAULT 30,
  reason        TEXT NOT NULL DEFAULT '',
  notes         TEXT,
  fee           BIGINT NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'HTG',
  is_paid       BOOLEAN NOT NULL DEFAULT false,
  queue_number  INT,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Medical Records ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hc_medical_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID NOT NULL,
  doctor_id        UUID NOT NULL,
  facility_id      UUID REFERENCES hc_facilities(id),
  type             TEXT NOT NULL DEFAULT 'consultation',
  title            TEXT NOT NULL,
  content          TEXT NOT NULL DEFAULT '',
  attachments      JSONB NOT NULL DEFAULT '[]',
  is_confidential  BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Prescriptions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hc_prescriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL,
  doctor_id     UUID NOT NULL,
  medications   JSONB NOT NULL DEFAULT '[]',
  diagnosis     TEXT NOT NULL DEFAULT '',
  notes         TEXT,
  qr_code       TEXT NOT NULL,
  valid_until   DATE NOT NULL,
  pharmacy_id   UUID,
  status        TEXT NOT NULL DEFAULT 'active',
  renewal_count INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Laboratory Orders ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hc_lab_orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL,
  doctor_id   UUID NOT NULL,
  facility_id UUID NOT NULL,
  test_type   TEXT NOT NULL DEFAULT 'blood',
  test_name   TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'ordered',
  priority    TEXT NOT NULL DEFAULT 'routine',
  results     TEXT,
  result_url  TEXT,
  ai_analysis TEXT,
  ordered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ready_at    TIMESTAMPTZ
);

-- ── Pharmacy Orders ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hc_pharmacy_orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id  UUID NOT NULL,
  pharmacy_id      UUID NOT NULL,
  patient_id       UUID NOT NULL,
  items            JSONB NOT NULL DEFAULT '[]',
  status           TEXT NOT NULL DEFAULT 'received',
  total_amount     BIGINT NOT NULL DEFAULT 0,
  currency         TEXT NOT NULL DEFAULT 'HTG',
  delivery_type    TEXT NOT NULL DEFAULT 'pickup',
  delivery_address TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Insurance Policies & Claims ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hc_insurance_policies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL,
  insurer_id      UUID NOT NULL,
  policy_number   TEXT NOT NULL UNIQUE,
  coverage_types  JSONB NOT NULL DEFAULT '[]',
  max_annual      BIGINT NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'HTG',
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hc_insurance_claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL,
  insurer_id      UUID NOT NULL,
  facility_id     UUID,
  appointment_id  UUID,
  type            TEXT NOT NULL DEFAULT 'consultation',
  total_amount    BIGINT NOT NULL DEFAULT 0,
  covered_amount  BIGINT NOT NULL DEFAULT 0,
  copayment       BIGINT NOT NULL DEFAULT 0,
  deductible      BIGINT NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'HTG',
  status          TEXT NOT NULL DEFAULT 'submitted',
  documents       JSONB NOT NULL DEFAULT '[]',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Emergency Requests ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hc_emergencies (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  patient_id     UUID,
  lat            NUMERIC(10,7) NOT NULL,
  lng            NUMERIC(10,7) NOT NULL,
  address        TEXT,
  description    TEXT NOT NULL DEFAULT '',
  severity       TEXT NOT NULL DEFAULT 'high',
  status         TEXT NOT NULL DEFAULT 'requesting',
  ambulance_id   UUID,
  hospital_id    UUID,
  dispatched_at  TIMESTAMPTZ,
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Telemedicine Sessions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hc_tele_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  UUID NOT NULL,
  patient_id      UUID NOT NULL,
  doctor_id       UUID NOT NULL,
  mode            TEXT NOT NULL DEFAULT 'video',
  status          TEXT NOT NULL DEFAULT 'scheduled',
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  duration        INT,
  room_token      TEXT,
  notes           TEXT,
  follow_up_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hc_facilities_city     ON hc_facilities(city, type);
CREATE INDEX IF NOT EXISTS idx_hc_patients_user       ON hc_patients(user_id);
CREATE INDEX IF NOT EXISTS idx_hc_doctors_facility    ON hc_doctors(facility_id, specialty);
CREATE INDEX IF NOT EXISTS idx_hc_appointments_patient ON hc_appointments(patient_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_hc_appointments_doctor  ON hc_appointments(doctor_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_hc_records_patient     ON hc_medical_records(patient_id, type);
CREATE INDEX IF NOT EXISTS idx_hc_prescriptions_pt    ON hc_prescriptions(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_hc_lab_patient         ON hc_lab_orders(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_hc_pharmacy_patient    ON hc_pharmacy_orders(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_hc_claims_patient      ON hc_insurance_claims(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_hc_emergency_status    ON hc_emergencies(status, created_at);