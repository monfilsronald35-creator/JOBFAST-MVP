-- ============================================================
-- JOBFAST — Migration 001: Financial Tables
-- Run in: Supabase SQL Editor (one-time)
-- Tables: wallets, payments, escrows, payouts, commissions, ledger_entries
--
-- Prerequisites:
--   • auth.users table exists (Supabase Auth)
--   • profiles table exists (created separately by Supabase setup)
--   • jobs table exists (created separately by Supabase setup)
-- ============================================================

-- ── Helper: auto-update updated_at on any row change ──────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- WALLETS
-- One row per (user, currency). Balance in integer minor units.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- PAYMENTS
-- Every monetary transaction — card, cash, wallet, etc.
-- status_history stored as JSONB append-only audit trail.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id                  UUID NOT NULL REFERENCES auth.users(id),
  payee_id                  UUID NOT NULL REFERENCES auth.users(id),
  job_id                    UUID REFERENCES jobs(id) ON DELETE SET NULL,
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
  stripe_client_secret      TEXT,   -- never SELECT this in list queries
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
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Append to status_history automatically on status change
CREATE OR REPLACE FUNCTION append_payment_status_history()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_history = NEW.status_history || jsonb_build_object(
      'status',    NEW.status,
      'timestamp', now()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER payments_status_history
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION append_payment_status_history();

-- ─────────────────────────────────────────────────────────────
-- ESCROWS
-- Funds held in trust between employer and worker.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS escrows (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            UUID NOT NULL REFERENCES jobs(id),
  payment_id        UUID NOT NULL UNIQUE REFERENCES payments(id),
  employer_id       UUID NOT NULL REFERENCES auth.users(id),
  worker_id         UUID NOT NULL REFERENCES auth.users(id),
  amount            BIGINT NOT NULL CHECK (amount >= 1),
  currency          TEXT   NOT NULL,
  status            TEXT   NOT NULL DEFAULT 'created'
                      CHECK (status IN (
                        'created','funded','released','refunding',
                        'refunded','disputed','resolved'
                      )),
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
  BEFORE UPDATE ON escrows
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION append_escrow_status_history()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_history = NEW.status_history || jsonb_build_object(
      'status',    NEW.status,
      'timestamp', now()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER escrows_status_history
  BEFORE UPDATE ON escrows
  FOR EACH ROW EXECUTE FUNCTION append_escrow_status_history();

-- ─────────────────────────────────────────────────────────────
-- PAYOUTS
-- Disbursements from platform to workers/providers.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id    UUID NOT NULL REFERENCES auth.users(id),
  escrow_id       UUID REFERENCES escrows(id) ON DELETE SET NULL,
  amount          BIGINT NOT NULL CHECK (amount >= 1),
  currency        TEXT   NOT NULL,
  status          TEXT   NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed','failed','cancelled','on_hold')),
  method          TEXT   NOT NULL
                    CHECK (method IN ('card','mobile_money','cash','wallet','bank_transfer')),
  external_ref    TEXT,
  initiated_by    UUID REFERENCES auth.users(id),
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
  BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION append_payout_status_history()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_history = NEW.status_history || jsonb_build_object(
      'status',    NEW.status,
      'timestamp', now()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER payouts_status_history
  BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION append_payout_status_history();

-- ─────────────────────────────────────────────────────────────
-- COMMISSIONS
-- Platform fee per payment or escrow.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_type    TEXT   NOT NULL CHECK (reference_type IN ('escrow','payment')),
  reference_id      UUID   NOT NULL,
  payer_id          UUID   NOT NULL REFERENCES auth.users(id),
  base_amount       BIGINT NOT NULL CHECK (base_amount >= 1),
  commission_amount BIGINT NOT NULL CHECK (commission_amount >= 0),
  rate              NUMERIC(6,5) NOT NULL,   -- e.g. 0.10000 = 10 %
  currency          TEXT   NOT NULL,
  tier              TEXT   NOT NULL
                      CHECK (tier IN ('role','profession','job_type','amount','promo')),
  promo_code        TEXT,
  tier_context      JSONB  NOT NULL DEFAULT '{}',
  settled           BOOLEAN NOT NULL DEFAULT false,
  settled_at        TIMESTAMPTZ,
  journal_id        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- LEDGER ENTRIES
-- Immutable double-entry accounting log.
-- NEVER UPDATE or DELETE rows in this table.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ledger_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id      TEXT   NOT NULL,          -- pairs the debit + credit entries
  user_id         UUID   NOT NULL REFERENCES auth.users(id),
  type            TEXT   NOT NULL CHECK (type IN ('debit','credit')),
  amount          BIGINT NOT NULL CHECK (amount >= 1),
  currency        TEXT   NOT NULL,
  balance_after   BIGINT NOT NULL CHECK (balance_after >= 0),
  reference_type  TEXT   NOT NULL
                    CHECK (reference_type IN ('payment','escrow','payout','commission','adjustment')),
  reference_id    UUID   NOT NULL,
  description     TEXT   NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  -- NO updated_at — this table is append-only
);

-- Prevent any UPDATE or DELETE on the ledger (immutability enforced at DB level)
CREATE OR REPLACE RULE ledger_no_update AS
  ON UPDATE TO ledger_entries DO INSTEAD NOTHING;

CREATE OR REPLACE RULE ledger_no_delete AS
  ON DELETE TO ledger_entries DO INSTEAD NOTHING;