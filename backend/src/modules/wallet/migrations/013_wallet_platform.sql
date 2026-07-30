-- JOBFAST FAZ 17: Global Financial Engine
-- All amounts in INTEGER MINOR UNITS (HTG centimes, USD cents).
-- Transactions are IMMUTABLE — never UPDATE or DELETE wlt_transactions.
-- Run manually in Supabase SQL Editor.

-- ─── Wallets ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wlt_wallets (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID        NOT NULL UNIQUE,
  status          TEXT        NOT NULL DEFAULT 'active',
  kyc_level       INT         NOT NULL DEFAULT 0,
  daily_spent     BIGINT      NOT NULL DEFAULT 0,
  monthly_spent   BIGINT      NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wlt_wallets_owner ON wlt_wallets(owner_id);

-- ─── Balances (one row per wallet+currency) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS wlt_balances (
  id                UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id         UUID   NOT NULL REFERENCES wlt_wallets(id) ON DELETE CASCADE,
  currency          TEXT   NOT NULL DEFAULT 'HTG',
  available_balance BIGINT NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance   BIGINT NOT NULL DEFAULT 0 CHECK (pending_balance   >= 0),
  escrow_balance    BIGINT NOT NULL DEFAULT 0 CHECK (escrow_balance    >= 0),
  reward_balance    BIGINT NOT NULL DEFAULT 0 CHECK (reward_balance    >= 0),
  cashback_balance  BIGINT NOT NULL DEFAULT 0 CHECK (cashback_balance  >= 0),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(wallet_id, currency)
);
CREATE INDEX IF NOT EXISTS idx_wlt_balances_wallet ON wlt_balances(wallet_id);

-- ─── Transactions (IMMUTABLE ledger) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wlt_transactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id   UUID        NOT NULL REFERENCES wlt_wallets(id),
  owner_id    UUID        NOT NULL,
  type        TEXT        NOT NULL,
  direction   TEXT        NOT NULL DEFAULT 'credit',
  status      TEXT        NOT NULL DEFAULT 'completed',
  amount      BIGINT      NOT NULL CHECK (amount > 0),
  fee         BIGINT      NOT NULL DEFAULT 0 CHECK (fee >= 0),
  net_amount  BIGINT      NOT NULL,
  currency    TEXT        NOT NULL DEFAULT 'HTG',
  reference   TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  description TEXT        NOT NULL DEFAULT '',
  metadata    JSONB,
  risk_score  INT,
  ip_address  TEXT,
  device_id   TEXT,
  country     TEXT,
  related_tx_id UUID,
  fail_reason TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wlt_tx_wallet    ON wlt_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wlt_tx_owner     ON wlt_transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_wlt_tx_type      ON wlt_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wlt_tx_status    ON wlt_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wlt_tx_created   ON wlt_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wlt_tx_reference ON wlt_transactions(reference);

-- ─── Escrows ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wlt_escrows (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id    UUID        NOT NULL,
  payee_id    UUID        NOT NULL,
  wallet_id   UUID        NOT NULL REFERENCES wlt_wallets(id),
  amount      BIGINT      NOT NULL CHECK (amount > 0),
  currency    TEXT        NOT NULL DEFAULT 'HTG',
  status      TEXT        NOT NULL DEFAULT 'locked',
  reference   TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  order_id    UUID,
  job_id      UUID,
  notes       TEXT,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_wlt_escrows_payer  ON wlt_escrows(payer_id);
CREATE INDEX IF NOT EXISTS idx_wlt_escrows_payee  ON wlt_escrows(payee_id);
CREATE INDEX IF NOT EXISTS idx_wlt_escrows_status ON wlt_escrows(status);

-- ─── Virtual Cards ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wlt_virtual_cards (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id     UUID        NOT NULL REFERENCES wlt_wallets(id) ON DELETE CASCADE,
  owner_id      UUID        NOT NULL,
  last4         TEXT        NOT NULL,
  expiry_month  INT         NOT NULL,
  expiry_year   INT         NOT NULL,
  cvv_hash      TEXT,
  status        TEXT        NOT NULL DEFAULT 'active',
  spend_limit   BIGINT      NOT NULL DEFAULT 0,
  currency      TEXT        NOT NULL DEFAULT 'HTG',
  is_disposable BOOLEAN     NOT NULL DEFAULT false,
  nickname      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wlt_cards_wallet ON wlt_virtual_cards(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wlt_cards_owner  ON wlt_virtual_cards(owner_id);

-- ─── Bank Accounts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wlt_bank_accounts (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id      UUID        NOT NULL REFERENCES wlt_wallets(id) ON DELETE CASCADE,
  owner_id       UUID        NOT NULL,
  bank_name      TEXT        NOT NULL,
  account_name   TEXT        NOT NULL,
  account_number TEXT        NOT NULL,
  routing_number TEXT,
  swift_code     TEXT,
  iban           TEXT,
  country        TEXT        NOT NULL,
  currency       TEXT        NOT NULL DEFAULT 'HTG',
  status         TEXT        NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wlt_bank_wallet ON wlt_bank_accounts(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wlt_bank_owner  ON wlt_bank_accounts(owner_id);

-- ─── Exchange Rates (cache) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wlt_exchange_rates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT        NOT NULL,
  to_currency   TEXT        NOT NULL,
  rate          NUMERIC(18,8) NOT NULL,
  fee           NUMERIC(5,4)  NOT NULL DEFAULT 0.02,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

-- ─── Exchange Transactions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wlt_exchange_txs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id     UUID        NOT NULL REFERENCES wlt_wallets(id),
  owner_id      UUID        NOT NULL,
  from_currency TEXT        NOT NULL,
  to_currency   TEXT        NOT NULL,
  from_amount   BIGINT      NOT NULL,
  to_amount     BIGINT      NOT NULL,
  rate          NUMERIC(18,8) NOT NULL,
  fee           BIGINT      NOT NULL DEFAULT 0,
  status        TEXT        NOT NULL DEFAULT 'completed',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wlt_exchange_wallet ON wlt_exchange_txs(wallet_id);

-- ─── Fee Config (configurable without code changes) ──────────────────────────
CREATE TABLE IF NOT EXISTS wlt_fee_config (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_type    TEXT        NOT NULL UNIQUE,
  fee_type   TEXT        NOT NULL DEFAULT 'percent',
  fee_value  NUMERIC(8,4) NOT NULL DEFAULT 0,
  min_fee    BIGINT      NOT NULL DEFAULT 0,
  max_fee    BIGINT      NOT NULL DEFAULT 0,
  currency   TEXT        NOT NULL DEFAULT 'HTG',
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO wlt_fee_config(tx_type, fee_type, fee_value, min_fee, max_fee) VALUES
  ('withdrawal',   'percent', 1.5,  100,  50000),
  ('transfer',     'percent', 0.5,   50,  10000),
  ('exchange',     'percent', 2.0,  200, 100000),
  ('payment',      'percent', 0.0,    0,      0),
  ('international','percent', 3.0,  500, 200000)
ON CONFLICT(tx_type) DO NOTHING;

-- ─── Limit Config ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wlt_limit_config (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_level         INT     NOT NULL UNIQUE,
  currency          TEXT    NOT NULL DEFAULT 'HTG',
  max_single_tx     BIGINT  NOT NULL DEFAULT 0,
  max_daily_volume  BIGINT  NOT NULL DEFAULT 0,
  max_monthly_volume BIGINT NOT NULL DEFAULT 0,
  max_daily_count   INT     NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO wlt_limit_config(kyc_level, max_single_tx, max_daily_volume, max_monthly_volume, max_daily_count) VALUES
  (0, 500000,    2000000,    10000000,   10),
  (1, 5000000,   20000000,   100000000,  50),
  (2, 50000000,  200000000,  1000000000, 200),
  (3, 500000000, 2000000000, 9999999999, 1000)
ON CONFLICT(kyc_level) DO NOTHING;

-- ─── Invoices ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wlt_invoices (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id    UUID        NOT NULL,
  recipient_id UUID        NOT NULL,
  number       TEXT        NOT NULL UNIQUE,
  status       TEXT        NOT NULL DEFAULT 'draft',
  currency     TEXT        NOT NULL DEFAULT 'HTG',
  subtotal     BIGINT      NOT NULL DEFAULT 0,
  tax_amount   BIGINT      NOT NULL DEFAULT 0,
  total        BIGINT      NOT NULL DEFAULT 0,
  due_date     DATE,
  paid_at      TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wlt_invoices_issuer    ON wlt_invoices(issuer_id);
CREATE INDEX IF NOT EXISTS idx_wlt_invoices_recipient ON wlt_invoices(recipient_id);
CREATE INDEX IF NOT EXISTS idx_wlt_invoices_status    ON wlt_invoices(status);

-- ─── Invoice Items ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wlt_invoice_items (
  id          UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID   NOT NULL REFERENCES wlt_invoices(id) ON DELETE CASCADE,
  description TEXT   NOT NULL,
  quantity    INT    NOT NULL DEFAULT 1,
  unit_price  BIGINT NOT NULL,
  total       BIGINT NOT NULL,
  tax_rate    NUMERIC(5,4)
);
CREATE INDEX IF NOT EXISTS idx_wlt_invoice_items ON wlt_invoice_items(invoice_id);

-- ─── Risk Scores ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wlt_risk_scores (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID        NOT NULL UNIQUE,
  wallet_id      UUID        NOT NULL REFERENCES wlt_wallets(id),
  score          INT         NOT NULL DEFAULT 0,
  level          TEXT        NOT NULL DEFAULT 'low',
  factors        JSONB       NOT NULL DEFAULT '{}',
  decision       TEXT        NOT NULL DEFAULT 'allow',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wlt_risk_wallet ON wlt_risk_scores(wallet_id);

-- ─── Fraud Flags ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wlt_fraud_flags (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id   UUID        NOT NULL REFERENCES wlt_wallets(id),
  owner_id    UUID        NOT NULL,
  type        TEXT        NOT NULL,
  severity    TEXT        NOT NULL DEFAULT 'medium',
  description TEXT        NOT NULL,
  metadata    JSONB       NOT NULL DEFAULT '{}',
  resolved    BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_wlt_fraud_wallet   ON wlt_fraud_flags(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wlt_fraud_resolved ON wlt_fraud_flags(resolved);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ACID RPC FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Ensure balance row exists ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION wlt_ensure_balance(p_wallet_id UUID, p_currency TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO wlt_balances(wallet_id, currency)
  VALUES (p_wallet_id, p_currency)
  ON CONFLICT(wallet_id, currency) DO NOTHING;
END;
$$;

-- ─── Credit wallet (ACID) ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION wlt_credit(
  p_wallet_id UUID, p_owner_id UUID, p_currency TEXT,
  p_amount BIGINT, p_type TEXT, p_description TEXT,
  p_fee BIGINT DEFAULT 0, p_metadata JSONB DEFAULT NULL,
  p_risk_score INT DEFAULT 0, p_ip TEXT DEFAULT NULL,
  p_device_id TEXT DEFAULT NULL, p_country TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_tx_id UUID;
BEGIN
  PERFORM wlt_ensure_balance(p_wallet_id, p_currency);
  UPDATE wlt_balances
     SET available_balance = available_balance + p_amount,
         updated_at        = NOW()
   WHERE wallet_id = p_wallet_id AND currency = p_currency;

  INSERT INTO wlt_transactions(
    wallet_id, owner_id, type, direction, status,
    amount, fee, net_amount, currency, description,
    metadata, risk_score, ip_address, device_id, country
  ) VALUES (
    p_wallet_id, p_owner_id, p_type, 'credit', 'completed',
    p_amount, p_fee, p_amount - p_fee, p_currency, p_description,
    p_metadata, p_risk_score, p_ip, p_device_id, p_country
  ) RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$;

-- ─── Debit wallet (ACID — fails if insufficient) ──────────────────────────────
CREATE OR REPLACE FUNCTION wlt_debit(
  p_wallet_id UUID, p_owner_id UUID, p_currency TEXT,
  p_amount BIGINT, p_type TEXT, p_description TEXT,
  p_fee BIGINT DEFAULT 0, p_metadata JSONB DEFAULT NULL,
  p_risk_score INT DEFAULT 0, p_ip TEXT DEFAULT NULL,
  p_device_id TEXT DEFAULT NULL, p_country TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, tx_id UUID, message TEXT) LANGUAGE plpgsql AS $$
DECLARE
  v_balance BIGINT;
  v_tx_id   UUID;
  v_total   BIGINT := p_amount + p_fee;
BEGIN
  PERFORM wlt_ensure_balance(p_wallet_id, p_currency);
  SELECT available_balance INTO v_balance
    FROM wlt_balances
   WHERE wallet_id = p_wallet_id AND currency = p_currency
   FOR UPDATE;

  IF v_balance < v_total THEN
    INSERT INTO wlt_transactions(
      wallet_id, owner_id, type, direction, status,
      amount, fee, net_amount, currency, description,
      metadata, risk_score, ip_address, device_id, country, fail_reason
    ) VALUES (
      p_wallet_id, p_owner_id, p_type, 'debit', 'failed',
      p_amount, p_fee, 0, p_currency, p_description,
      p_metadata, p_risk_score, p_ip, p_device_id, p_country, 'insufficient_funds'
    ) RETURNING id INTO v_tx_id;
    RETURN QUERY SELECT false, v_tx_id, 'insufficient_funds'::TEXT;
    RETURN;
  END IF;

  UPDATE wlt_balances
     SET available_balance = available_balance - v_total,
         updated_at        = NOW()
   WHERE wallet_id = p_wallet_id AND currency = p_currency;

  UPDATE wlt_wallets
     SET daily_spent   = daily_spent   + v_total,
         monthly_spent = monthly_spent + v_total,
         updated_at    = NOW()
   WHERE id = p_wallet_id;

  INSERT INTO wlt_transactions(
    wallet_id, owner_id, type, direction, status,
    amount, fee, net_amount, currency, description,
    metadata, risk_score, ip_address, device_id, country
  ) VALUES (
    p_wallet_id, p_owner_id, p_type, 'debit', 'completed',
    p_amount, p_fee, p_amount, p_currency, p_description,
    p_metadata, p_risk_score, p_ip, p_device_id, p_country
  ) RETURNING id INTO v_tx_id;

  RETURN QUERY SELECT true, v_tx_id, 'ok'::TEXT;
END;
$$;

-- ─── Internal transfer (ACID — both sides atomic) ─────────────────────────────
CREATE OR REPLACE FUNCTION wlt_transfer(
  p_from_wallet UUID, p_from_owner UUID,
  p_to_wallet   UUID, p_to_owner   UUID,
  p_currency TEXT, p_amount BIGINT, p_fee BIGINT,
  p_description TEXT, p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, debit_tx UUID, credit_tx UUID, message TEXT)
LANGUAGE plpgsql AS $$
DECLARE
  v_balance  BIGINT;
  v_total    BIGINT := p_amount + p_fee;
  v_debit_id UUID;
  v_credit_id UUID;
BEGIN
  PERFORM wlt_ensure_balance(p_from_wallet, p_currency);
  PERFORM wlt_ensure_balance(p_to_wallet,   p_currency);

  SELECT available_balance INTO v_balance
    FROM wlt_balances WHERE wallet_id = p_from_wallet AND currency = p_currency FOR UPDATE;
  IF v_balance < v_total THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, 'insufficient_funds'::TEXT;
    RETURN;
  END IF;

  -- Debit sender
  UPDATE wlt_balances SET available_balance = available_balance - v_total, updated_at = NOW()
   WHERE wallet_id = p_from_wallet AND currency = p_currency;
  INSERT INTO wlt_transactions(wallet_id, owner_id, type, direction, status, amount, fee, net_amount, currency, description, metadata)
  VALUES (p_from_wallet, p_from_owner, 'transfer', 'debit', 'completed', p_amount, p_fee, p_amount, p_currency, p_description, p_metadata)
  RETURNING id INTO v_debit_id;

  -- Credit receiver
  UPDATE wlt_balances SET available_balance = available_balance + p_amount, updated_at = NOW()
   WHERE wallet_id = p_to_wallet AND currency = p_currency;
  INSERT INTO wlt_transactions(wallet_id, owner_id, type, direction, status, amount, fee, net_amount, currency, description, metadata, related_tx_id)
  VALUES (p_to_wallet, p_to_owner, 'transfer', 'credit', 'completed', p_amount, 0, p_amount, p_currency, p_description, p_metadata, v_debit_id)
  RETURNING id INTO v_credit_id;

  -- Update spending counters for sender
  UPDATE wlt_wallets SET daily_spent = daily_spent + v_total, monthly_spent = monthly_spent + v_total, updated_at = NOW()
   WHERE id = p_from_wallet;

  RETURN QUERY SELECT true, v_debit_id, v_credit_id, 'ok'::TEXT;
END;
$$;

-- ─── Lock escrow (ACID) ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION wlt_lock_escrow(
  p_payer_wallet UUID, p_payer_id UUID, p_payee_id UUID,
  p_currency TEXT, p_amount BIGINT, p_reference TEXT,
  p_order_id UUID DEFAULT NULL, p_job_id UUID DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, escrow_id UUID, message TEXT) LANGUAGE plpgsql AS $$
DECLARE
  v_balance   BIGINT;
  v_escrow_id UUID;
BEGIN
  PERFORM wlt_ensure_balance(p_payer_wallet, p_currency);
  SELECT available_balance INTO v_balance
    FROM wlt_balances WHERE wallet_id = p_payer_wallet AND currency = p_currency FOR UPDATE;

  IF v_balance < p_amount THEN
    RETURN QUERY SELECT false, NULL::UUID, 'insufficient_funds'::TEXT; RETURN;
  END IF;

  UPDATE wlt_balances
     SET available_balance = available_balance - p_amount,
         escrow_balance    = escrow_balance    + p_amount,
         updated_at        = NOW()
   WHERE wallet_id = p_payer_wallet AND currency = p_currency;

  INSERT INTO wlt_escrows(payer_id, payee_id, wallet_id, amount, currency, reference, order_id, job_id, expires_at)
  VALUES (p_payer_id, p_payee_id, p_payer_wallet, p_amount, p_currency, p_reference, p_order_id, p_job_id, p_expires_at)
  RETURNING id INTO v_escrow_id;

  INSERT INTO wlt_transactions(wallet_id, owner_id, type, direction, status, amount, fee, net_amount, currency, description)
  VALUES (p_payer_wallet, p_payer_id, 'escrow', 'debit', 'completed', p_amount, 0, p_amount, p_currency, 'Escrow lock: ' || p_reference);

  RETURN QUERY SELECT true, v_escrow_id, 'ok'::TEXT;
END;
$$;

-- ─── Release escrow (ACID — credit payee) ────────────────────────────────────
CREATE OR REPLACE FUNCTION wlt_release_escrow(p_escrow_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) LANGUAGE plpgsql AS $$
DECLARE
  v_escrow    wlt_escrows%ROWTYPE;
  v_payee_wlt UUID;
BEGIN
  SELECT * INTO v_escrow FROM wlt_escrows WHERE id = p_escrow_id FOR UPDATE;
  IF NOT FOUND THEN RETURN QUERY SELECT false, 'Escrow not found'::TEXT; RETURN; END IF;
  IF v_escrow.status <> 'locked' THEN RETURN QUERY SELECT false, 'Escrow not in locked state'::TEXT; RETURN; END IF;

  SELECT id INTO v_payee_wlt FROM wlt_wallets WHERE owner_id = v_escrow.payee_id;
  IF NOT FOUND THEN RETURN QUERY SELECT false, 'Payee wallet not found'::TEXT; RETURN; END IF;

  PERFORM wlt_ensure_balance(v_payee_wlt, v_escrow.currency);

  -- Release from payer escrow balance
  UPDATE wlt_balances SET escrow_balance = escrow_balance - v_escrow.amount, updated_at = NOW()
   WHERE wallet_id = v_escrow.wallet_id AND currency = v_escrow.currency;

  -- Credit payee available balance
  UPDATE wlt_balances SET available_balance = available_balance + v_escrow.amount, updated_at = NOW()
   WHERE wallet_id = v_payee_wlt AND currency = v_escrow.currency;

  UPDATE wlt_escrows SET status = 'released', released_at = NOW() WHERE id = p_escrow_id;

  INSERT INTO wlt_transactions(wallet_id, owner_id, type, direction, status, amount, fee, net_amount, currency, description)
  VALUES (v_payee_wlt, v_escrow.payee_id, 'escrow_release', 'credit', 'completed',
          v_escrow.amount, 0, v_escrow.amount, v_escrow.currency, 'Escrow release: ' || v_escrow.reference);

  RETURN QUERY SELECT true, 'ok'::TEXT;
END;
$$;

-- ─── Refund escrow (ACID — return to payer) ───────────────────────────────────
CREATE OR REPLACE FUNCTION wlt_refund_escrow(p_escrow_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) LANGUAGE plpgsql AS $$
DECLARE
  v_escrow wlt_escrows%ROWTYPE;
BEGIN
  SELECT * INTO v_escrow FROM wlt_escrows WHERE id = p_escrow_id FOR UPDATE;
  IF NOT FOUND THEN RETURN QUERY SELECT false, 'Escrow not found'::TEXT; RETURN; END IF;
  IF v_escrow.status NOT IN ('locked','disputed') THEN RETURN QUERY SELECT false, 'Cannot refund escrow in current state'::TEXT; RETURN; END IF;

  UPDATE wlt_balances
     SET escrow_balance    = escrow_balance    - v_escrow.amount,
         available_balance = available_balance + v_escrow.amount,
         updated_at        = NOW()
   WHERE wallet_id = v_escrow.wallet_id AND currency = v_escrow.currency;

  UPDATE wlt_escrows SET status = 'refunded', refunded_at = NOW() WHERE id = p_escrow_id;

  INSERT INTO wlt_transactions(wallet_id, owner_id, type, direction, status, amount, fee, net_amount, currency, description)
  VALUES (v_escrow.wallet_id, v_escrow.payer_id, 'refund', 'credit', 'completed',
          v_escrow.amount, 0, v_escrow.amount, v_escrow.currency, 'Escrow refund: ' || v_escrow.reference);

  RETURN QUERY SELECT true, 'ok'::TEXT;
END;
$$;

-- ─── Reset daily spending counters (run via cron daily) ───────────────────────
CREATE OR REPLACE FUNCTION wlt_reset_daily_spent()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE wlt_wallets SET daily_spent = 0, updated_at = NOW();
END;
$$;
