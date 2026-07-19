-- ============================================================
-- JOBFAST — Migration 008: Master Reconciliation
-- ============================================================
-- PURPOSE:
--   The Supabase project had a pre-existing schema from a different
--   application (integer-id tables, incompatible column names).
--   This script:
--     1. Grants service_role full access (fixes 403 errors)
--     2. Drops incompatible tables (integer IDs, wrong columns)
--     3. Patches the existing `profiles` table (add JOBFAST columns)
--     4. Patches the existing `notifications` table
--     5. Creates all missing JOBFAST tables (UUID-based, refs profiles)
--     6. Creates required triggers and indexes
--
-- Run in: Supabase Dashboard → SQL Editor
-- Safe to run multiple times (idempotent).
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- STEP 0: Grant service_role full access to all public tables
-- ──────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- ──────────────────────────────────────────────────────────────
-- STEP 1: set_updated_at helper trigger (idempotent)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- STEP 2: Drop incompatible tables (CASCADE handles FKs)
-- These tables existed in the pre-JOBFAST schema with integer IDs
-- or incompatible column layouts.
-- ──────────────────────────────────────────────────────────────

-- Remove FK from profiles.wallet_id before dropping wallets
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wallet_id;

-- Drop integer-id tables that conflict with our UUID schema
DROP TABLE IF EXISTS public.conversations  CASCADE;
DROP TABLE IF EXISTS public.messages       CASCADE;
DROP TABLE IF EXISTS public.wallets        CASCADE;
DROP TABLE IF EXISTS public.applications   CASCADE;
DROP TABLE IF EXISTS public.jobs           CASCADE;
DROP TABLE IF EXISTS public.escrows        CASCADE;
DROP TABLE IF EXISTS public.payouts        CASCADE;
DROP TABLE IF EXISTS public.commissions    CASCADE;
DROP TABLE IF EXISTS public.ledger_entries CASCADE;
DROP TABLE IF EXISTS public.posts          CASCADE;
DROP TABLE IF EXISTS public.post_likes     CASCADE;
DROP TABLE IF EXISTS public.post_comments  CASCADE;
DROP TABLE IF EXISTS public.user_follows   CASCADE;
DROP TABLE IF EXISTS public.payments       CASCADE;

-- ──────────────────────────────────────────────────────────────
-- STEP 3: Patch the existing `profiles` table
-- The table already exists with many columns. We add only
-- the JOBFAST-specific ones that are missing.
-- ──────────────────────────────────────────────────────────────

-- Remove FK to auth.users on id (we manage our own UUIDs)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Custom JWT auth column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- JOBFAST identity fields (existing table has first_name/last_name; we add name)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession TEXT;

-- JSONB metadata
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_metadata     JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completeness  INTEGER NOT NULL DEFAULT 0;

-- Migration 007 business / reputation data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_data     JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS enterprise_data  JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reputation_data  JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketplace_data JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trust_score      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS availability     TEXT NOT NULL DEFAULT 'available';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_lat     DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_lng     DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stats            JSONB NOT NULL DEFAULT '{}';

-- Ensure email is unique (needed for login duplicate check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_email_key' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
END $$;

-- Indexes for JOBFAST auth + matching queries
CREATE INDEX IF NOT EXISTS idx_profiles_email        ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_role         ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_category     ON public.profiles (category);
CREATE INDEX IF NOT EXISTS idx_profiles_profession   ON public.profiles (profession);
CREATE INDEX IF NOT EXISTS profiles_verified_idx     ON public.profiles (verified);
CREATE INDEX IF NOT EXISTS profiles_trust_score_idx  ON public.profiles (trust_score DESC);
CREATE INDEX IF NOT EXISTS profiles_availability_idx ON public.profiles (availability);
CREATE INDEX IF NOT EXISTS profiles_account_status_idx ON public.profiles (account_status);
CREATE INDEX IF NOT EXISTS profiles_location_lat_idx ON public.profiles (location_lat);
CREATE INDEX IF NOT EXISTS profiles_location_lng_idx ON public.profiles (location_lng);

-- ──────────────────────────────────────────────────────────────
-- STEP 4: Patch the existing `notifications` table
-- Existing: id(UUID), user_id, type, status, title, body, data, action_url, expires_at
-- JOBFAST needs: message (not body), is_read (not status)
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message      TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS source_user_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_job_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill: if existing rows have body, copy to message
UPDATE public.notifications SET message = body WHERE message IS NULL AND body IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notif_user_read    ON public.notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notif_user_created ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_user_type    ON public.notifications (user_id, type);

-- ──────────────────────────────────────────────────────────────
-- STEP 5: JOBFAST jobs table (UUID-based, references profiles)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jobs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title               TEXT NOT NULL DEFAULT '',
  description         TEXT NOT NULL DEFAULT '',
  type                TEXT NOT NULL DEFAULT 'one_time',
  business_type       TEXT,
  service_category    TEXT,
  construction_role   TEXT,
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','paused','filled','cancelled','expired')),
  is_available        BOOLEAN NOT NULL DEFAULT true,
  location_city       TEXT,
  location_country    TEXT NOT NULL DEFAULT 'Haiti',
  location_address    TEXT,
  location            GEOGRAPHY(POINT, 4326),
  radius_km           NUMERIC NOT NULL DEFAULT 25,
  budget_min          BIGINT  NOT NULL DEFAULT 0,
  budget_max          BIGINT  NOT NULL DEFAULT 0,
  budget_currency     TEXT    NOT NULL DEFAULT 'HTG',
  is_negotiable       BOOLEAN NOT NULL DEFAULT false,
  views               INTEGER NOT NULL DEFAULT 0,
  applications        INTEGER NOT NULL DEFAULT 0,
  saves               INTEGER NOT NULL DEFAULT 0,
  tags                TEXT[]  NOT NULL DEFAULT '{}',
  is_urgent           BOOLEAN NOT NULL DEFAULT false,
  boosted             BOOLEAN NOT NULL DEFAULT false,
  boost_expires_at    TIMESTAMPTZ,
  required_skills     TEXT[]  NOT NULL DEFAULT '{}',
  experience_level    TEXT,
  preferred_gender    TEXT,
  min_rating_required NUMERIC NOT NULL DEFAULT 0,
  notify_radius_km    NUMERIC NOT NULL DEFAULT 25,
  sent_notifications  INTEGER NOT NULL DEFAULT 0,
  rating_average      NUMERIC NOT NULL DEFAULT 0,
  rating_count        INTEGER NOT NULL DEFAULT 0,
  metadata            JSONB   NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_jobs_user      ON public.jobs (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status    ON public.jobs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_type      ON public.jobs (type, status);
CREATE INDEX IF NOT EXISTS idx_jobs_boosted   ON public.jobs (boosted, boost_expires_at) WHERE boosted = true;

-- ──────────────────────────────────────────────────────────────
-- STEP 6: JOBFAST applications table
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','reviewed','accepted','rejected','withdrawn','completed')),
  cover_letter    TEXT,
  proposed_rate   BIGINT,
  currency        TEXT NOT NULL DEFAULT 'HTG',
  notes           TEXT,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, applicant_id)
);

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_apps_job       ON public.applications (job_id, status);
CREATE INDEX IF NOT EXISTS idx_apps_applicant ON public.applications (applicant_id, status, created_at DESC);

-- ──────────────────────────────────────────────────────────────
-- STEP 7: JOBFAST messages table (UUID-based)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message         TEXT NOT NULL DEFAULT '' CHECK (char_length(message) <= 2000),
  type            TEXT NOT NULL DEFAULT 'text'
                    CHECK (type IN ('text','audio','image')),
  client_id       TEXT UNIQUE,
  status          TEXT NOT NULL DEFAULT 'sent'
                    CHECK (status IN ('sent','delivered','read')),
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender       ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver     ON public.messages (receiver_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ──────────────────────────────────────────────────────────────
-- STEP 8: JOBFAST conversations view
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.conversation_summaries AS
SELECT DISTINCT ON (conversation_id)
  conversation_id,
  sender_id,
  receiver_id,
  message         AS last_message,
  type            AS last_message_type,
  status          AS last_status,
  created_at      AS last_message_at
FROM public.messages
ORDER BY conversation_id, created_at DESC;

-- ──────────────────────────────────────────────────────────────
-- STEP 9: posts + social tables (UUID-based, refs profiles)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type           TEXT NOT NULL DEFAULT 'photo'
                   CHECK (type IN ('photo','video','promotion','text')),
  media_url      TEXT NOT NULL DEFAULT '',
  thumbnail_url  TEXT NOT NULL DEFAULT '',
  caption        TEXT NOT NULL DEFAULT '' CHECK (char_length(caption) <= 500),
  audience       TEXT NOT NULL DEFAULT 'public'
                   CHECK (audience IN ('public','followers','private')),
  likes_count    INT  NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INT  NOT NULL DEFAULT 0 CHECK (comments_count >= 0),
  duration       INT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_posts_user_created ON public.posts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_audience     ON public.posts (audience, created_at DESC);

CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.post_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text       TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments (post_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower  ON public.user_follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.user_follows (following_id);

-- ──────────────────────────────────────────────────────────────
-- STEP 10: Financial tables (UUID-based, refs profiles — NOT auth.users)
-- ──────────────────────────────────────────────────────────────

-- WALLETS
CREATE TABLE IF NOT EXISTS public.wallets (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance              BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency             TEXT   NOT NULL DEFAULT 'HTG',
  status               TEXT   NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active', 'frozen', 'closed')),
  total_credited       BIGINT NOT NULL DEFAULT 0,
  total_debited        BIGINT NOT NULL DEFAULT 0,
  last_transaction_at  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, currency)
);

CREATE TRIGGER wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_wallets_user_currency ON public.wallets (user_id, currency);
CREATE INDEX IF NOT EXISTS idx_wallets_status        ON public.wallets (status);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id                  UUID NOT NULL REFERENCES public.profiles(id),
  payee_id                  UUID NOT NULL REFERENCES public.profiles(id),
  job_id                    UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  amount                    BIGINT NOT NULL CHECK (amount >= 1),
  currency                  TEXT   NOT NULL DEFAULT 'HTG',
  status                    TEXT   NOT NULL DEFAULT 'pending'
                              CHECK (status IN (
                                'pending','authorized','captured','completed',
                                'failed','cancelled','refunding','refunded','disputed'
                              )),
  method                    TEXT   NOT NULL
                              CHECK (method IN ('card','mobile_money','cash','wallet','bank_transfer')),
  idempotency_key           TEXT   NOT NULL UNIQUE,
  stripe_payment_intent_id  TEXT,
  stripe_client_secret      TEXT,
  amount_refunded           BIGINT NOT NULL DEFAULT 0,
  captured_at               TIMESTAMPTZ,
  failed_at                 TIMESTAMPTZ,
  refunded_at               TIMESTAMPTZ,
  cancelled_at              TIMESTAMPTZ,
  status_history            JSONB  NOT NULL DEFAULT '[]',
  metadata                  JSONB  NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION append_payment_status_history()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_history = NEW.status_history || jsonb_build_object('status', NEW.status, 'timestamp', now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER payments_status_history
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION append_payment_status_history();

CREATE INDEX IF NOT EXISTS idx_payments_payer  ON public.payments (payer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_payee  ON public.payments (payee_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_job    ON public.payments (job_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe ON public.payments (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- ESCROWS
CREATE TABLE IF NOT EXISTS public.escrows (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  payment_id        UUID UNIQUE REFERENCES public.payments(id),
  employer_id       UUID NOT NULL REFERENCES public.profiles(id),
  worker_id         UUID NOT NULL REFERENCES public.profiles(id),
  amount            BIGINT NOT NULL CHECK (amount >= 1),
  currency          TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'created'
                      CHECK (status IN ('created','funded','released','refunding','refunded','disputed','resolved')),
  commission_amount BIGINT NOT NULL DEFAULT 0,
  net_amount        BIGINT NOT NULL DEFAULT 0,
  commission_id     UUID,
  funded_at         TIMESTAMPTZ,
  released_at       TIMESTAMPTZ,
  refunded_at       TIMESTAMPTZ,
  disputed_at       TIMESTAMPTZ,
  resolved_at       TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  status_history    JSONB NOT NULL DEFAULT '[]',
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER escrows_updated_at
  BEFORE UPDATE ON public.escrows
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION append_escrow_status_history()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_history = NEW.status_history || jsonb_build_object('status', NEW.status, 'timestamp', now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER escrows_status_history
  BEFORE UPDATE ON public.escrows
  FOR EACH ROW EXECUTE FUNCTION append_escrow_status_history();

CREATE INDEX IF NOT EXISTS idx_escrows_employer ON public.escrows (employer_id, status);
CREATE INDEX IF NOT EXISTS idx_escrows_worker   ON public.escrows (worker_id, status);
CREATE INDEX IF NOT EXISTS idx_escrows_expires  ON public.escrows (status, expires_at) WHERE expires_at IS NOT NULL;

-- PAYOUTS
CREATE TABLE IF NOT EXISTS public.payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id    UUID NOT NULL REFERENCES public.profiles(id),
  escrow_id       UUID REFERENCES public.escrows(id) ON DELETE SET NULL,
  amount          BIGINT NOT NULL CHECK (amount >= 1),
  currency        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed','failed','cancelled','on_hold')),
  method          TEXT NOT NULL
                    CHECK (method IN ('card','mobile_money','cash','wallet','bank_transfer')),
  external_ref    TEXT,
  initiated_by    UUID REFERENCES public.profiles(id),
  failure_reason  TEXT,
  processed_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  journal_id      TEXT,
  status_history  JSONB NOT NULL DEFAULT '[]',
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER payouts_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION append_payout_status_history()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_history = NEW.status_history || jsonb_build_object('status', NEW.status, 'timestamp', now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER payouts_status_history
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION append_payout_status_history();

CREATE INDEX IF NOT EXISTS idx_payouts_recipient ON public.payouts (recipient_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_status    ON public.payouts (status, created_at DESC);

-- COMMISSIONS
CREATE TABLE IF NOT EXISTS public.commissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_type    TEXT NOT NULL CHECK (reference_type IN ('escrow','payment')),
  reference_id      UUID NOT NULL,
  payer_id          UUID NOT NULL REFERENCES public.profiles(id),
  base_amount       BIGINT NOT NULL CHECK (base_amount >= 1),
  commission_amount BIGINT NOT NULL CHECK (commission_amount >= 0),
  rate              NUMERIC(6,5) NOT NULL,
  currency          TEXT NOT NULL,
  tier              TEXT NOT NULL CHECK (tier IN ('role','profession','job_type','amount','promo')),
  promo_code        TEXT,
  tier_context      JSONB NOT NULL DEFAULT '{}',
  settled           BOOLEAN NOT NULL DEFAULT false,
  settled_at        TIMESTAMPTZ,
  journal_id        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER commissions_updated_at
  BEFORE UPDATE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_commissions_reference ON public.commissions (reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_commissions_payer     ON public.commissions (payer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commissions_unsettled ON public.commissions (settled, settled_at) WHERE settled = false;

-- LEDGER ENTRIES (append-only — no update/delete)
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id      TEXT NOT NULL,
  user_id         UUID NOT NULL REFERENCES public.profiles(id),
  type            TEXT NOT NULL CHECK (type IN ('debit','credit')),
  amount          BIGINT NOT NULL CHECK (amount >= 1),
  currency        TEXT NOT NULL,
  balance_after   BIGINT NOT NULL CHECK (balance_after >= 0),
  reference_type  TEXT NOT NULL CHECK (reference_type IN ('payment','escrow','payout','commission','adjustment')),
  reference_id    UUID NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE RULE ledger_no_update AS ON UPDATE TO public.ledger_entries DO INSTEAD NOTHING;
CREATE OR REPLACE RULE ledger_no_delete AS ON DELETE TO public.ledger_entries DO INSTEAD NOTHING;

CREATE INDEX IF NOT EXISTS idx_ledger_journal   ON public.ledger_entries (journal_id, type);
CREATE INDEX IF NOT EXISTS idx_ledger_user      ON public.ledger_entries (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON public.ledger_entries (reference_type, reference_id);

-- ──────────────────────────────────────────────────────────────
-- STEP 11: Financial stored procedures (ACID wallet operations)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION credit_wallet(
  p_user_id     UUID,
  p_amount      BIGINT,
  p_currency    TEXT,
  p_reference   TEXT,
  p_journal_id  TEXT
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_wallet wallets%ROWTYPE;
BEGIN
  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id AND currency = p_currency FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO wallets (user_id, currency, balance, total_credited)
    VALUES (p_user_id, p_currency, p_amount, p_amount)
    RETURNING * INTO v_wallet;
  ELSE
    UPDATE wallets SET
      balance            = balance + p_amount,
      total_credited     = total_credited + p_amount,
      last_transaction_at = now(),
      updated_at         = now()
    WHERE id = v_wallet.id
    RETURNING * INTO v_wallet;
  END IF;
  INSERT INTO ledger_entries (journal_id, user_id, type, amount, currency, balance_after, reference_type, reference_id, description)
  VALUES (p_journal_id, p_user_id, 'credit', p_amount, p_currency, v_wallet.balance, 'payment', gen_random_uuid(), p_reference);
  RETURN jsonb_build_object('balance', v_wallet.balance, 'currency', v_wallet.currency);
END;
$$;

CREATE OR REPLACE FUNCTION debit_wallet(
  p_user_id     UUID,
  p_amount      BIGINT,
  p_currency    TEXT,
  p_reference   TEXT,
  p_journal_id  TEXT
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_wallet wallets%ROWTYPE;
BEGIN
  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id AND currency = p_currency FOR UPDATE;
  IF NOT FOUND OR v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS';
  END IF;
  UPDATE wallets SET
    balance             = balance - p_amount,
    total_debited       = total_debited + p_amount,
    last_transaction_at = now(),
    updated_at          = now()
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;
  INSERT INTO ledger_entries (journal_id, user_id, type, amount, currency, balance_after, reference_type, reference_id, description)
  VALUES (p_journal_id, p_user_id, 'debit', p_amount, p_currency, v_wallet.balance, 'payment', gen_random_uuid(), p_reference);
  RETURN jsonb_build_object('balance', v_wallet.balance, 'currency', v_wallet.currency);
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- STEP 12: Re-grant after creating new tables
-- ──────────────────────────────────────────────────────────────
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ──────────────────────────────────────────────────────────────
-- DONE — Schema is now compatible with JOBFAST backend
-- ──────────────────────────────────────────────────────────────