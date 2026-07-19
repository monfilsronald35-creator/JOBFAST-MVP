-- ============================================================
-- JOBFAST — Migration 005: Indexes + Row Level Security
-- Run in: Supabase SQL Editor (after 001–004)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- PERFORMANCE INDEXES
-- ─────────────────────────────────────────────────────────────

-- Wallets
CREATE INDEX IF NOT EXISTS idx_wallets_user_currency ON wallets (user_id, currency);
CREATE INDEX IF NOT EXISTS idx_wallets_status        ON wallets (status);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_payer        ON payments (payer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_payee        ON payments (payee_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_job          ON payments (job_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe       ON payments (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- Escrows
CREATE INDEX IF NOT EXISTS idx_escrows_employer      ON escrows (employer_id, status);
CREATE INDEX IF NOT EXISTS idx_escrows_worker        ON escrows (worker_id, status);
CREATE INDEX IF NOT EXISTS idx_escrows_expires       ON escrows (status, expires_at)
  WHERE expires_at IS NOT NULL;

-- Payouts
CREATE INDEX IF NOT EXISTS idx_payouts_recipient     ON payouts (recipient_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_status        ON payouts (status, created_at DESC);

-- Commissions
CREATE INDEX IF NOT EXISTS idx_commissions_reference ON commissions (reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_commissions_payer     ON commissions (payer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commissions_unsettled ON commissions (settled, settled_at)
  WHERE settled = false;

-- Ledger entries
CREATE INDEX IF NOT EXISTS idx_ledger_journal        ON ledger_entries (journal_id, type);
CREATE INDEX IF NOT EXISTS idx_ledger_user           ON ledger_entries (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_reference      ON ledger_entries (reference_type, reference_id);

-- Notifications (table already exists in Supabase — add missing indexes)
CREATE INDEX IF NOT EXISTS idx_notif_user_read       ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notif_user_created    ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_user_type       ON notifications (user_id, type);
CREATE INDEX IF NOT EXISTS idx_notif_expires         ON notifications (expires_at)
  WHERE expires_at IS NOT NULL;

-- Messages
CREATE INDEX IF NOT EXISTS idx_msg_conv_created      ON messages (conversation_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
--
-- Strategy: the backend uses the service-role client (bypasses
-- RLS), so policies here protect DIRECT database access only
-- (e.g. Supabase dashboard, anon client, client-side SDK).
-- ─────────────────────────────────────────────────────────────

-- WALLETS — users can only see their own wallet
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallet_owner_select" ON wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wallet_owner_insert" ON wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- No direct UPDATE/DELETE — mutations go through stored procedures only

-- PAYMENTS — payer or payee can see the row
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_parties_select" ON payments
  FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = payee_id);

-- ESCROWS — employer or worker can see the row
ALTER TABLE escrows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "escrow_parties_select" ON escrows
  FOR SELECT USING (auth.uid() = employer_id OR auth.uid() = worker_id);

-- PAYOUTS — recipient can see their own payouts
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payout_recipient_select" ON payouts
  FOR SELECT USING (auth.uid() = recipient_id);

-- LEDGER ENTRIES — users can see only their own entries
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ledger_owner_select" ON ledger_entries
  FOR SELECT USING (auth.uid() = user_id);

-- POSTS — public posts are visible to all; followers/private respect audience
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_public_select" ON posts
  FOR SELECT USING (audience = 'public');

CREATE POLICY "posts_owner_all" ON posts
  FOR ALL USING (auth.uid() = user_id);

-- POST LIKES — any authenticated user can like; owner sees all
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_authenticated" ON post_likes
  FOR ALL USING (auth.uid() = user_id);

-- POST COMMENTS — same
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_authenticated" ON post_comments
  FOR ALL USING (auth.uid() = user_id);

-- MESSAGES — only the sender or receiver can see/write
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_parties_select" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "messages_sender_insert" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- USER FOLLOWS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_authenticated" ON user_follows
  FOR ALL USING (auth.uid() = follower_id);