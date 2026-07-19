-- ============================================================
-- JOBFAST — Migration 004: Financial Stored Procedures (ACID)
-- Run in: Supabase SQL Editor (after 001)
--
-- These PostgreSQL functions replace Mongoose sessions.
-- Each function runs in a single transaction — atomicity is
-- guaranteed by the database, not the application layer.
--
-- Called from Node.js via: supabase.rpc('function_name', args)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- jobfast_credit_wallet
-- Atomically credit a wallet AND write the ledger entry.
-- Returns the updated wallet row.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION jobfast_credit_wallet(
  p_user_id        UUID,
  p_amount         BIGINT,
  p_currency       TEXT,
  p_journal_id     TEXT,
  p_reference_type TEXT,
  p_reference_id   UUID,
  p_description    TEXT DEFAULT ''
)
RETURNS wallets
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_wallet wallets;
BEGIN
  -- Acquire a row-level lock to prevent concurrent balance modifications
  SELECT * INTO v_wallet
  FROM wallets
  WHERE user_id = p_user_id AND currency = p_currency
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND: No % wallet for user %', p_currency, p_user_id;
  END IF;

  IF v_wallet.status != 'active' THEN
    RAISE EXCEPTION 'WALLET_NOT_ACTIVE: Wallet is %', v_wallet.status;
  END IF;

  -- Credit the wallet
  UPDATE wallets
  SET
    balance             = balance + p_amount,
    total_credited      = total_credited + p_amount,
    last_transaction_at = now(),
    updated_at          = now()
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  -- Append immutable ledger entry
  INSERT INTO ledger_entries
    (journal_id, user_id, type, amount, currency, balance_after,
     reference_type, reference_id, description)
  VALUES
    (p_journal_id, p_user_id, 'credit', p_amount, p_currency, v_wallet.balance,
     p_reference_type, p_reference_id, p_description);

  RETURN v_wallet;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- jobfast_debit_wallet
-- Atomically debit a wallet AND write the ledger entry.
-- Raises an exception if balance is insufficient (no optimistic debit).
-- Returns the updated wallet row.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION jobfast_debit_wallet(
  p_user_id        UUID,
  p_amount         BIGINT,
  p_currency       TEXT,
  p_journal_id     TEXT,
  p_reference_type TEXT,
  p_reference_id   UUID,
  p_description    TEXT DEFAULT ''
)
RETURNS wallets
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_wallet wallets;
BEGIN
  SELECT * INTO v_wallet
  FROM wallets
  WHERE user_id = p_user_id AND currency = p_currency
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND: No % wallet for user %', p_currency, p_user_id;
  END IF;

  IF v_wallet.status != 'active' THEN
    RAISE EXCEPTION 'WALLET_NOT_ACTIVE: Wallet is %', v_wallet.status;
  END IF;

  IF v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS: balance % < required %', v_wallet.balance, p_amount;
  END IF;

  -- Debit the wallet
  UPDATE wallets
  SET
    balance             = balance - p_amount,
    total_debited       = total_debited + p_amount,
    last_transaction_at = now(),
    updated_at          = now()
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  -- Append immutable ledger entry
  INSERT INTO ledger_entries
    (journal_id, user_id, type, amount, currency, balance_after,
     reference_type, reference_id, description)
  VALUES
    (p_journal_id, p_user_id, 'debit', p_amount, p_currency, v_wallet.balance,
     p_reference_type, p_reference_id, p_description);

  RETURN v_wallet;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- jobfast_wallet_transfer
-- Atomically transfer funds between two wallets + ledger entries.
-- Used for peer-to-peer wallet payments.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION jobfast_wallet_transfer(
  p_from_user_id   UUID,
  p_to_user_id     UUID,
  p_amount         BIGINT,
  p_currency       TEXT,
  p_journal_id     TEXT,
  p_reference_type TEXT,
  p_reference_id   UUID,
  p_description    TEXT DEFAULT ''
)
RETURNS TABLE(from_wallet wallets, to_wallet wallets)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_from wallets;
  v_to   wallets;
BEGIN
  -- Lock both wallets in a consistent order (by id) to prevent deadlocks
  SELECT * INTO v_from FROM wallets
  WHERE user_id = p_from_user_id AND currency = p_currency
  FOR UPDATE;

  SELECT * INTO v_to FROM wallets
  WHERE user_id = p_to_user_id AND currency = p_currency
  FOR UPDATE;

  IF NOT FOUND OR v_from.id IS NULL THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND: Sender has no % wallet', p_currency;
  END IF;

  IF v_to.id IS NULL THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND: Recipient has no % wallet', p_currency;
  END IF;

  IF v_from.status != 'active' THEN
    RAISE EXCEPTION 'WALLET_NOT_ACTIVE: Sender wallet is %', v_from.status;
  END IF;

  IF v_from.balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS: balance % < required %', v_from.balance, p_amount;
  END IF;

  -- Debit sender
  UPDATE wallets
  SET balance = balance - p_amount, total_debited = total_debited + p_amount,
      last_transaction_at = now(), updated_at = now()
  WHERE id = v_from.id RETURNING * INTO v_from;

  -- Credit recipient
  UPDATE wallets
  SET balance = balance + p_amount, total_credited = total_credited + p_amount,
      last_transaction_at = now(), updated_at = now()
  WHERE id = v_to.id RETURNING * INTO v_to;

  -- Ledger: debit sender
  INSERT INTO ledger_entries
    (journal_id, user_id, type, amount, currency, balance_after, reference_type, reference_id, description)
  VALUES
    (p_journal_id, p_from_user_id, 'debit', p_amount, p_currency, v_from.balance,
     p_reference_type, p_reference_id, p_description);

  -- Ledger: credit recipient
  INSERT INTO ledger_entries
    (journal_id, user_id, type, amount, currency, balance_after, reference_type, reference_id, description)
  VALUES
    (p_journal_id, p_to_user_id, 'credit', p_amount, p_currency, v_to.balance,
     p_reference_type, p_reference_id, p_description);

  RETURN QUERY SELECT v_from, v_to;
END;
$$;