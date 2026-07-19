-- ============================================================
-- JOBFAST — Migration 003: Messages
-- Run in: Supabase SQL Editor (after 002)
-- Enables Supabase Realtime on the messages table.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- MESSAGES
-- conversation_id: deterministic string — smaller_uuid + '_' + larger_uuid
-- This ensures both parties always reference the same conversation row.
-- client_id: sparse UNIQUE — idempotency key sent by the mobile client
--            to prevent duplicate messages on reconnect.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  sender_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message         TEXT NOT NULL DEFAULT '' CHECK (char_length(message) <= 2000),
  type            TEXT NOT NULL DEFAULT 'text'
                    CHECK (type IN ('text','audio','image')),
  client_id       TEXT UNIQUE,   -- sparse — NULL allowed, but non-NULL must be unique
  status          TEXT NOT NULL DEFAULT 'sent'
                    CHECK (status IN ('sent','delivered','read')),
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Primary access pattern: fetch a conversation in chronological order
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender       ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver     ON messages (receiver_id);

-- ── Enable Supabase Realtime on the messages table ────────────────────────
-- After running this migration, go to:
--   Supabase Dashboard → Database → Replication → Tables
-- and enable replication for the `messages` table.
--
-- Alternatively, run:
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ─────────────────────────────────────────────────────────────
-- CONVERSATIONS VIEW
-- Materialized summary of each conversation for the inbox list.
-- Returns the latest message per conversation for a given user.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW conversation_summaries AS
SELECT DISTINCT ON (conversation_id)
  conversation_id,
  sender_id,
  receiver_id,
  message    AS last_message,
  type       AS last_message_type,
  status     AS last_status,
  created_at AS last_message_at
FROM messages
ORDER BY conversation_id, created_at DESC;