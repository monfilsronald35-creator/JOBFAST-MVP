-- ============================================================
-- Migration 011 — Jobs & Workforce Platform
-- Run manually in Supabase SQL Editor
-- ============================================================

-- ——— Core job postings ——————————————————————————————————————————————————————
-- NOTE: 'jobs' table already exists (marketplace jobs, FAZ 7).
-- This migration adds the employment-platform tables with prefix job_postings/job_*.
CREATE TABLE IF NOT EXISTS job_postings (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title               VARCHAR(200) NOT NULL,
  description         TEXT        NOT NULL,
  responsibilities    TEXT,
  requirements        TEXT,
  skills              TEXT[]      NOT NULL DEFAULT '{}',
  experience_years    SMALLINT,
  education_level     VARCHAR(50),
  languages           TEXT[]      NOT NULL DEFAULT '{}',
  -- Compensation (integer minor units per governance)
  salary_min          BIGINT,
  salary_max          BIGINT,
  salary_period       VARCHAR(20),
  currency            VARCHAR(3)  NOT NULL DEFAULT 'HTG',
  benefits            TEXT[]      NOT NULL DEFAULT '{}',
  -- Classification
  category            VARCHAR(100),
  industry            VARCHAR(100) NOT NULL,
  job_type            VARCHAR(30) NOT NULL,
  work_mode           VARCHAR(20) NOT NULL DEFAULT 'on_site',
  -- Location
  country             VARCHAR(3),
  city                VARCHAR(100),
  address             TEXT,
  lat                 NUMERIC(10,7),
  lng                 NUMERIC(10,7),
  -- Flags
  positions           SMALLINT    NOT NULL DEFAULT 1,
  deadline            DATE,
  status              VARCHAR(20) NOT NULL DEFAULT 'draft',
  is_urgent           BOOLEAN     NOT NULL DEFAULT false,
  is_verified         BOOLEAN     NOT NULL DEFAULT false,
  is_sponsored        BOOLEAN     NOT NULL DEFAULT false,
  is_international    BOOLEAN     NOT NULL DEFAULT false,
  is_remote_ok        BOOLEAN     NOT NULL DEFAULT false,
  -- Counters
  views_count         INTEGER     NOT NULL DEFAULT 0,
  applications_count  INTEGER     NOT NULL DEFAULT 0,
  hired_count         INTEGER     NOT NULL DEFAULT 0,
  -- Timestamps
  published_at        TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_employer    ON job_postings (employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status      ON job_postings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_industry    ON job_postings (industry);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type    ON job_postings (job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_location    ON job_postings (country, city);
CREATE INDEX IF NOT EXISTS idx_jobs_skills      ON job_postings USING gin(skills);
CREATE INDEX IF NOT EXISTS idx_jobs_languages   ON job_postings USING gin(languages);
CREATE INDEX IF NOT EXISTS idx_jobs_published   ON job_postings (published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_jobs_geo         ON job_postings (lat, lng) WHERE lat IS NOT NULL;

-- ——— Applications ————————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS job_applications (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id      UUID        NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  applicant_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status          VARCHAR(30) NOT NULL DEFAULT 'applied',
  cover_letter    TEXT,
  resume_url      TEXT,
  video_url       TEXT,
  portfolio_urls  TEXT[]      NOT NULL DEFAULT '{}',
  match_score     NUMERIC(5,2),
  notes           TEXT,
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (posting_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_posting    ON job_applications (posting_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON job_applications (applicant_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_score     ON job_applications (match_score DESC NULLS LAST);

-- ——— Hiring Pipeline ————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS job_pipeline (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID        NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  stage          VARCHAR(30) NOT NULL,
  scheduled_at   TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  notes          TEXT,
  metadata       JSONB       NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_app ON job_pipeline (application_id, created_at DESC);

-- ——— AI Match Scores ————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS job_ai_scores (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id    UUID        NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  worker_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_score   NUMERIC(5,2) NOT NULL DEFAULT 0,
  skills_score  NUMERIC(5,2),
  exp_score     NUMERIC(5,2),
  dist_score    NUMERIC(5,2),
  salary_score  NUMERIC(5,2),
  lang_score    NUMERIC(5,2),
  avail_score   NUMERIC(5,2),
  rep_score     NUMERIC(5,2),
  breakdown     JSONB       NOT NULL DEFAULT '{}',
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (posting_id, worker_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_scores_posting ON job_ai_scores (posting_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_scores_worker ON job_ai_scores (worker_id, match_score DESC);

-- ——— Contracts ——————————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS job_contracts (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id          UUID        NOT NULL REFERENCES job_postings(id),
  employer_id         UUID        NOT NULL REFERENCES profiles(id),
  worker_id           UUID        NOT NULL REFERENCES profiles(id),
  type                VARCHAR(30) NOT NULL DEFAULT 'employment',
  title               VARCHAR(200),
  terms               TEXT,
  salary_amount       BIGINT      NOT NULL,
  currency            VARCHAR(3)  NOT NULL DEFAULT 'HTG',
  start_date          DATE        NOT NULL,
  end_date            DATE,
  status              VARCHAR(20) NOT NULL DEFAULT 'draft',
  employer_signed_at  TIMESTAMPTZ,
  worker_signed_at    TIMESTAMPTZ,
  terminated_at       TIMESTAMPTZ,
  termination_reason  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_employer ON job_contracts (employer_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_worker   ON job_contracts (worker_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_posting  ON job_contracts (posting_id);

-- ——— Work Schedules ——————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS job_schedules (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id  UUID        NOT NULL REFERENCES job_contracts(id) ON DELETE CASCADE,
  worker_id    UUID        NOT NULL REFERENCES profiles(id),
  shift_date   DATE        NOT NULL,
  start_time   TIME        NOT NULL,
  end_time     TIME        NOT NULL,
  break_mins   SMALLINT    NOT NULL DEFAULT 0,
  status       VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_contract ON job_schedules (contract_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_schedules_worker   ON job_schedules (worker_id, shift_date);

-- ——— Attendance / Time Tracking ——————————————————————————————————————————
CREATE TABLE IF NOT EXISTS job_attendance (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id  UUID        REFERENCES job_schedules(id),
  contract_id  UUID        NOT NULL REFERENCES job_contracts(id),
  worker_id    UUID        NOT NULL REFERENCES profiles(id),
  clock_in     TIMESTAMPTZ NOT NULL,
  clock_out    TIMESTAMPTZ,
  hours_worked NUMERIC(5,2),
  status       VARCHAR(20) NOT NULL DEFAULT 'present',
  lat          NUMERIC(10,7),
  lng          NUMERIC(10,7),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_contract ON job_attendance (contract_id, clock_in DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_worker   ON job_attendance (worker_id, clock_in DESC);

-- ——— Payroll Records ————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS job_payroll (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id  UUID        NOT NULL REFERENCES job_contracts(id),
  employer_id  UUID        NOT NULL REFERENCES profiles(id),
  worker_id    UUID        NOT NULL REFERENCES profiles(id),
  period_start DATE        NOT NULL,
  period_end   DATE        NOT NULL,
  gross_amount BIGINT      NOT NULL,
  tax_amount   BIGINT      NOT NULL DEFAULT 0,
  bonus_amount BIGINT      NOT NULL DEFAULT 0,
  net_amount   BIGINT      NOT NULL,
  currency     VARCHAR(3)  NOT NULL DEFAULT 'HTG',
  status       VARCHAR(20) NOT NULL DEFAULT 'pending',
  paid_at      TIMESTAMPTZ,
  payment_ref  VARCHAR(100),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_employer ON job_payroll (employer_id, status);
CREATE INDEX IF NOT EXISTS idx_payroll_worker   ON job_payroll (worker_id, status);
CREATE INDEX IF NOT EXISTS idx_payroll_contract ON job_payroll (contract_id, period_start DESC);

-- ——— Job Analytics (aggregates) ——————————————————————————————————————————
CREATE TABLE IF NOT EXISTS job_analytics (
  posting_id          UUID    PRIMARY KEY REFERENCES job_postings(id) ON DELETE CASCADE,
  total_views         INTEGER NOT NULL DEFAULT 0,
  unique_views        INTEGER NOT NULL DEFAULT 0,
  total_applications  INTEGER NOT NULL DEFAULT 0,
  shortlisted_count   INTEGER NOT NULL DEFAULT 0,
  interview_count     INTEGER NOT NULL DEFAULT 0,
  hired_count         INTEGER NOT NULL DEFAULT 0,
  avg_match_score     NUMERIC(5,2),
  avg_time_to_hire_days INTEGER,
  last_updated        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
