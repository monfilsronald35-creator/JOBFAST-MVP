-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FAZ 28 — Maps & Location Intelligence Platform (migration 028)
-- Prefix: maps_
-- Run manually in Supabase SQL Editor
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── Geocode cache ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maps_geocache (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_key  TEXT NOT NULL UNIQUE,
  address    TEXT NOT NULL,
  lat        NUMERIC(10,7) NOT NULL,
  lng        NUMERIC(10,7) NOT NULL,
  city       TEXT,
  country    TEXT NOT NULL DEFAULT 'HT',
  place_id   TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Service areas ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maps_service_areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL,
  name        TEXT NOT NULL,
  center_lat  NUMERIC(10,7) NOT NULL,
  center_lng  NUMERIC(10,7) NOT NULL,
  radius_km   NUMERIC(6,2) NOT NULL DEFAULT 10,
  country     TEXT NOT NULL DEFAULT 'HT',
  city        TEXT NOT NULL DEFAULT '',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Live tracking (rolling window — keep last 24h) ────────────────────────────
CREATE TABLE IF NOT EXISTS maps_tracking (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id    UUID NOT NULL,
  entity_type  TEXT NOT NULL DEFAULT 'driver',
  lat          NUMERIC(10,7) NOT NULL,
  lng          NUMERIC(10,7) NOT NULL,
  speed        NUMERIC(6,2),
  heading      NUMERIC(5,2),
  accuracy     NUMERIC(6,2),
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_maps_geocache_key   ON maps_geocache(query_key);
CREATE INDEX IF NOT EXISTS idx_maps_geocache_exp   ON maps_geocache(expires_at);
CREATE INDEX IF NOT EXISTS idx_maps_areas_owner    ON maps_service_areas(owner_id);
CREATE INDEX IF NOT EXISTS idx_maps_tracking_ent   ON maps_tracking(entity_id, recorded_at DESC);