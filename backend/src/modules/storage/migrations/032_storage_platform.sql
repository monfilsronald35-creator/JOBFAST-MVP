-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FAZ 32 — Global Enterprise Storage Platform (migration 032)
-- Prefix: stor_
-- Run manually in Supabase SQL Editor
-- Buckets to create in Supabase Dashboard:
--   jobfast-public  (public)
--   jobfast-private (private)
--   jobfast-temp    (private, lifecycle 24h)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── File registry ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stor_files (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by      UUID NOT NULL,
  bucket           TEXT NOT NULL,
  path             TEXT NOT NULL UNIQUE,
  filename         TEXT NOT NULL,
  mime_type        TEXT NOT NULL,
  size_bytes       BIGINT NOT NULL DEFAULT 0,
  category         TEXT NOT NULL DEFAULT 'general',
  permission_level TEXT NOT NULL DEFAULT 'private',
  status           TEXT NOT NULL DEFAULT 'active',
  is_temp          BOOLEAN NOT NULL DEFAULT false,
  expires_at       TIMESTAMPTZ,
  version_count    INTEGER NOT NULL DEFAULT 1,
  public_url       TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── File versions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stor_file_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id     UUID NOT NULL REFERENCES stor_files(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  path        TEXT NOT NULL,
  size_bytes  BIGINT NOT NULL DEFAULT 0,
  created_by  UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (file_id, version)
);

-- ── Per-file ACL ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stor_file_acl (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id      UUID NOT NULL REFERENCES stor_files(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL,
  subject_id   TEXT NOT NULL,
  can_read     BOOLEAN NOT NULL DEFAULT true,
  can_write    BOOLEAN NOT NULL DEFAULT false,
  can_delete   BOOLEAN NOT NULL DEFAULT false,
  granted_by   UUID NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (file_id, subject_type, subject_id)
);

-- ── Thumbnails & transforms ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stor_thumbnails (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id     UUID NOT NULL REFERENCES stor_files(id) ON DELETE CASCADE,
  width       INTEGER NOT NULL,
  height      INTEGER NOT NULL,
  url         TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (file_id, width, height)
);

-- ── AI analysis results ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stor_ai_analysis (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id         UUID NOT NULL REFERENCES stor_files(id) ON DELETE CASCADE UNIQUE,
  is_nsfw         BOOLEAN NOT NULL DEFAULT false,
  content_type    TEXT NOT NULL DEFAULT '',
  extracted_text  TEXT,
  summary         TEXT,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  confidence      NUMERIC(4,3) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_stor_files_owner    ON stor_files(uploaded_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stor_files_category ON stor_files(category, status);
CREATE INDEX IF NOT EXISTS idx_stor_files_expires  ON stor_files(expires_at) WHERE is_temp = true;
CREATE INDEX IF NOT EXISTS idx_stor_files_status   ON stor_files(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_stor_versions_file  ON stor_file_versions(file_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_stor_acl_file       ON stor_file_acl(file_id, subject_type);
CREATE INDEX IF NOT EXISTS idx_stor_thumb_file     ON stor_thumbnails(file_id);