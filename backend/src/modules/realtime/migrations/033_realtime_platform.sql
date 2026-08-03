-- =============================================================
-- FAZ 33 — Realtime Platform
-- Migration: 033_realtime_platform.sql
-- Run manually in Supabase SQL Editor
-- =============================================================

-- Offline sync queue — operations queued by clients while offline
CREATE TABLE IF NOT EXISTS rt_sync_queue (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id   text        NOT NULL,
  operation   jsonb       NOT NULL,  -- { id, type, entity, entityId, data, ts }
  status      text        NOT NULL DEFAULT 'pending',  -- pending | applied | conflicted
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rt_sync_queue_user    ON rt_sync_queue(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rt_sync_queue_status  ON rt_sync_queue(status);

-- Last sync checkpoint per user+device
CREATE TABLE IF NOT EXISTS rt_sync_checkpoints (
  user_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id    text        NOT NULL,
  last_sync_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, device_id)
);

-- Extended presence log (optional — for last_seen queries)
CREATE TABLE IF NOT EXISTS rt_presence_log (
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status     text        NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

CREATE INDEX IF NOT EXISTS idx_rt_presence_log_changed ON rt_presence_log(changed_at);

-- Auto-clean sync queue older than 7 days
CREATE OR REPLACE FUNCTION rt_cleanup_sync_queue() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM rt_sync_queue WHERE created_at < now() - INTERVAL '7 days';
END;
$$;

COMMENT ON TABLE rt_sync_queue        IS 'FAZ 33: Offline sync operation queue per user+device';
COMMENT ON TABLE rt_sync_checkpoints  IS 'FAZ 33: Last sync timestamp per user+device';
COMMENT ON TABLE rt_presence_log      IS 'FAZ 33: Extended presence state log';