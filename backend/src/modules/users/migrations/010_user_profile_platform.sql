-- ============================================================
-- Migration 010 — User & Profile Platform
-- Run manually in Supabase SQL Editor
-- ============================================================

-- ——— Extended profile data ——————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS user_profile_extended (
  user_id              UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  profile_type         VARCHAR(60)  NOT NULL DEFAULT 'customer',
  -- Identity
  username             VARCHAR(50)  UNIQUE,
  display_name         VARCHAR(100),
  business_name        VARCHAR(200),
  legal_name           VARCHAR(200),
  public_id            VARCHAR(30)  UNIQUE,
  headline             VARCHAR(200),
  bio                  TEXT,
  avatar_url           TEXT,
  cover_url            TEXT,
  -- Personal
  birth_date           DATE,
  gender               VARCHAR(20),
  nationality          VARCHAR(3),
  timezone             VARCHAR(60),
  currency             VARCHAR(3)   DEFAULT 'HTG',
  languages            TEXT[]       NOT NULL DEFAULT '{}',
  -- Contact
  whatsapp             VARCHAR(20),
  website              TEXT,
  emergency_contact    JSONB,
  social_links         JSONB        NOT NULL DEFAULT '{}',
  -- Professional (individual)
  job_title            VARCHAR(100),
  profession           VARCHAR(100),
  skills               TEXT[]       NOT NULL DEFAULT '{}',
  experience           JSONB        NOT NULL DEFAULT '[]',
  education            JSONB        NOT NULL DEFAULT '[]',
  certifications       JSONB        NOT NULL DEFAULT '[]',
  licenses             JSONB        NOT NULL DEFAULT '[]',
  awards               JSONB        NOT NULL DEFAULT '[]',
  -- Business
  registration_number  VARCHAR(100),
  tax_number           VARCHAR(100),
  industry             VARCHAR(100),
  employee_count       INTEGER,
  business_hours       JSONB,
  branches             JSONB        NOT NULL DEFAULT '[]',
  services             TEXT[]       NOT NULL DEFAULT '{}',
  products             TEXT[]       NOT NULL DEFAULT '{}',
  -- Visibility
  is_public            BOOLEAN      NOT NULL DEFAULT true,
  is_searchable        BOOLEAN      NOT NULL DEFAULT true,
  -- Timestamps
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upe_profile_type ON user_profile_extended (profile_type);
CREATE INDEX IF NOT EXISTS idx_upe_industry     ON user_profile_extended (industry) WHERE industry IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_upe_skills       ON user_profile_extended USING gin(skills);
CREATE INDEX IF NOT EXISTS idx_upe_languages    ON user_profile_extended USING gin(languages);
CREATE INDEX IF NOT EXISTS idx_upe_public_id    ON user_profile_extended (public_id) WHERE public_id IS NOT NULL;

-- ——— Verifications ——————————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS user_verifications (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type             VARCHAR(30) NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  submitted_at     TIMESTAMPTZ,
  reviewed_at      TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  reviewed_by      UUID        REFERENCES profiles(id),
  rejection_reason TEXT,
  metadata         JSONB       NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, type)
);

CREATE INDEX IF NOT EXISTS idx_verifications_user   ON user_verifications (user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON user_verifications (status);

-- ——— Documents ————————————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS user_documents (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         VARCHAR(50) NOT NULL,
  file_name    VARCHAR(255) NOT NULL,
  file_url     TEXT        NOT NULL,
  file_size    INTEGER     NOT NULL,
  mime_type    VARCHAR(100),
  is_verified  BOOLEAN     NOT NULL DEFAULT false,
  expires_at   TIMESTAMPTZ,
  metadata     JSONB       NOT NULL DEFAULT '{}',
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user ON user_documents (user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON user_documents (user_id, type);

-- ——— Portfolio ————————————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS user_portfolio (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('photo','video','document','project','work')),
  title       VARCHAR(200),
  description TEXT,
  url         TEXT        NOT NULL,
  thumbnail   TEXT,
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  metadata    JSONB       NOT NULL DEFAULT '{}',
  is_public   BOOLEAN     NOT NULL DEFAULT true,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user ON user_portfolio (user_id, type);

-- ——— Reputation ————————————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS user_reputation (
  user_id           UUID    PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  rating            NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count      INTEGER      NOT NULL DEFAULT 0,
  success_rate      NUMERIC(5,2) NOT NULL DEFAULT 0,
  completion_rate   NUMERIC(5,2) NOT NULL DEFAULT 0,
  cancellation_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  complaint_rate    NUMERIC(5,2) NOT NULL DEFAULT 0,
  trust_score       NUMERIC(5,2) NOT NULL DEFAULT 0,
  reliability_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  overall_score     NUMERIC(5,2) NOT NULL DEFAULT 0,
  trend             VARCHAR(10)  NOT NULL DEFAULT 'stable',
  last_calculated   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ——— Reviews ——————————————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS user_reviews (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id UUID        NOT NULL REFERENCES profiles(id),
  rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  context     VARCHAR(30) NOT NULL DEFAULT 'general',
  context_id  UUID,
  is_verified BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, reviewer_id, context_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_user     ON user_reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON user_reviews (reviewer_id);

-- ——— AI Profile Scores ————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS user_ai_scores (
  user_id               UUID    PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  ai_score              NUMERIC(5,2) NOT NULL DEFAULT 0,
  hiring_probability    NUMERIC(5,2) NOT NULL DEFAULT 0,
  marketplace_score     NUMERIC(5,2) NOT NULL DEFAULT 0,
  trust_score           NUMERIC(5,2) NOT NULL DEFAULT 0,
  visibility_score      NUMERIC(5,2) NOT NULL DEFAULT 0,
  completeness_score    NUMERIC(5,2) NOT NULL DEFAULT 0,
  strengths             TEXT[]  NOT NULL DEFAULT '{}',
  weaknesses            TEXT[]  NOT NULL DEFAULT '{}',
  suggested_improvements TEXT[] NOT NULL DEFAULT '{}',
  last_analyzed         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ——— Availability ————————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS user_availability (
  user_id    UUID        PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  status     VARCHAR(20) NOT NULL DEFAULT 'offline',
  message    VARCHAR(200),
  until      TIMESTAMPTZ,
  timezone   VARCHAR(60),
  schedule   JSONB       NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ——— Privacy settings ————————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  user_id               UUID        PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  profile_visibility    VARCHAR(20) NOT NULL DEFAULT 'public',
  contact_visibility    VARCHAR(20) NOT NULL DEFAULT 'public',
  document_visibility   VARCHAR(20) NOT NULL DEFAULT 'private',
  show_email            BOOLEAN     NOT NULL DEFAULT false,
  show_phone            BOOLEAN     NOT NULL DEFAULT false,
  show_birth_date       BOOLEAN     NOT NULL DEFAULT false,
  show_address          BOOLEAN     NOT NULL DEFAULT false,
  allow_messages        VARCHAR(20) NOT NULL DEFAULT 'everyone',
  searchable            BOOLEAN     NOT NULL DEFAULT true,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ——— Profile analytics ———————————————————————————————————————————————————
CREATE TABLE IF NOT EXISTS user_profile_views (
  id          BIGSERIAL   PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id   UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  viewer_type VARCHAR(30) NOT NULL DEFAULT 'anonymous',
  source      VARCHAR(50),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_user    ON user_profile_views (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_created ON user_profile_views (created_at DESC);

-- Aggregate analytics (updated by triggers or cron)
CREATE TABLE IF NOT EXISTS user_profile_analytics (
  user_id            UUID    PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_views        INTEGER NOT NULL DEFAULT 0,
  views_this_week    INTEGER NOT NULL DEFAULT 0,
  views_this_month   INTEGER NOT NULL DEFAULT 0,
  search_appearances INTEGER NOT NULL DEFAULT 0,
  employer_visits    INTEGER NOT NULL DEFAULT 0,
  customer_visits    INTEGER NOT NULL DEFAULT 0,
  last_updated       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
