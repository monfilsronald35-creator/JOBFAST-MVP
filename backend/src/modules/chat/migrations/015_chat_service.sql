-- 015_chat_service.sql — Global Communication Platform
-- Run in Supabase SQL Editor

-- ── Rooms ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_rooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT,
  type            TEXT NOT NULL DEFAULT 'direct'
    CHECK (type IN ('direct','group','company','support','community','broadcast','channel')),
  created_by      UUID NOT NULL REFERENCES profiles(id),
  avatar_url      TEXT,
  description     TEXT,
  is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
  is_encrypted    BOOLEAN NOT NULL DEFAULT FALSE,
  job_id          UUID,
  order_id        UUID,
  last_message_at TIMESTAMPTZ,
  member_count    INTEGER NOT NULL DEFAULT 0,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Members ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_members (
  room_id   UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id),
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at   TIMESTAMPTZ,
  is_muted  BOOLEAN NOT NULL DEFAULT FALSE,
  nickname  TEXT,
  PRIMARY KEY (room_id, user_id)
);

-- ── Messages ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id           UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id         UUID NOT NULL REFERENCES profiles(id),
  type              TEXT NOT NULL DEFAULT 'text'
    CHECK (type IN ('text','image','video','audio','file','voice_note','location','contact','gif','sticker','system','ai')),
  content           TEXT,
  metadata          JSONB,
  reply_to_id       UUID REFERENCES chat_messages(id),
  is_edited         BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned         BOOLEAN NOT NULL DEFAULT FALSE,
  moderation_action TEXT NOT NULL DEFAULT 'none'
    CHECK (moderation_action IN ('none','warn','hide','review','block')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Attachments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_attachments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('image','video','audio','document','archive','location','contact','cad')),
  url        TEXT NOT NULL,
  name       TEXT NOT NULL,
  size       BIGINT NOT NULL DEFAULT 0,
  mime_type  TEXT NOT NULL,
  thumbnail  TEXT,
  duration   INTEGER,
  width      INTEGER,
  height     INTEGER,
  metadata   JSONB
);

-- ── Reactions ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_reactions (
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id),
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id, emoji)
);

-- ── Read Receipts ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_read_receipts (
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  room_id    UUID NOT NULL,
  user_id    UUID NOT NULL REFERENCES profiles(id),
  status     TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','delivered','read')),
  read_at    TIMESTAMPTZ,
  PRIMARY KEY (message_id, user_id)
);

-- ── Presence ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_presence (
  user_id     UUID PRIMARY KEY REFERENCES profiles(id),
  status      TEXT NOT NULL DEFAULT 'offline'
    CHECK (status IN ('online','offline','away','busy','in_meeting','typing','recording')),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active_room UUID REFERENCES chat_rooms(id) ON DELETE SET NULL,
  device_id   TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Calls ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_calls (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID NOT NULL REFERENCES chat_rooms(id),
  caller_id  UUID NOT NULL REFERENCES profiles(id),
  type       TEXT NOT NULL CHECK (type IN ('voice','video')),
  status     TEXT NOT NULL DEFAULT 'ringing'
    CHECK (status IN ('ringing','active','ended','missed','declined','failed')),
  started_at TIMESTAMPTZ,
  ended_at   TIMESTAMPTZ,
  duration   INTEGER,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_call_participants (
  call_id   UUID NOT NULL REFERENCES chat_calls(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id),
  joined_at TIMESTAMPTZ,
  left_at   TIMESTAMPTZ,
  PRIMARY KEY (call_id, user_id)
);

-- ── Pins ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_pins (
  room_id    UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  pinned_by  UUID NOT NULL REFERENCES profiles(id),
  pinned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (room_id, message_id)
);

-- ── Translations Cache ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_translations (
  message_id      UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  target_lang     TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, target_lang)
);

-- ── Moderation Logs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_moderation_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id),
  action     TEXT NOT NULL,
  flags      JSONB NOT NULL DEFAULT '[]',
  score      SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chat_members_user    ON chat_members(user_id) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_room   ON chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_receipts_room   ON chat_read_receipts(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_presence_online ON chat_presence(status) WHERE status != 'offline';
CREATE INDEX IF NOT EXISTS idx_chat_rooms_job       ON chat_rooms(job_id) WHERE job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_msgs_fts
  ON chat_messages USING gin(to_tsvector('english', coalesce(content, '')));

-- ── Triggers ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION chat_update_member_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chat_rooms SET member_count = member_count + 1 WHERE id = NEW.room_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.left_at IS NULL AND NEW.left_at IS NOT NULL THEN
    UPDATE chat_rooms SET member_count = GREATEST(0, member_count - 1) WHERE id = NEW.room_id;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE TRIGGER chat_members_count
AFTER INSERT OR UPDATE ON chat_members
FOR EACH ROW EXECUTE FUNCTION chat_update_member_count();

CREATE OR REPLACE FUNCTION chat_touch_room()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE chat_rooms SET last_message_at = NEW.created_at, updated_at = NEW.created_at WHERE id = NEW.room_id;
  RETURN NEW;
END $$;

CREATE OR REPLACE TRIGGER chat_message_touch_room
AFTER INSERT ON chat_messages
FOR EACH ROW EXECUTE FUNCTION chat_touch_room();
