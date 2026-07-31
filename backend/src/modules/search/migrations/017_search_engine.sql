-- 017_search_engine.sql — Global Discovery Engine
-- Run in Supabase SQL Editor

-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── Unified Search Index ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS srch_index (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          TEXT NOT NULL
    CHECK (source IN ('jobs','products','services','companies','workers','hotels',
                      'restaurants','hospitals','schools','universities','gov_services',
                      'telecom','flights','cars','properties','events','documents','knowledge_base')),
  source_id       UUID NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  tags            TEXT[] DEFAULT '{}',
  image_url       TEXT,
  action_url      TEXT,
  -- Geo
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  country         TEXT,
  city            TEXT,
  -- Ranking signals
  price           BIGINT,
  currency        TEXT DEFAULT 'HTG',
  rating          NUMERIC(3,2) DEFAULT 0,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  is_premium      BOOLEAN NOT NULL DEFAULT FALSE,
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  popularity      INTEGER NOT NULL DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 0,
  -- Full text search vector
  search_vector   TSVECTOR,
  -- Flexible metadata
  metadata        JSONB DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, source_id)
);

-- Auto-update search_vector on insert/update
CREATE OR REPLACE FUNCTION srch_update_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER srch_vector_trigger
  BEFORE INSERT OR UPDATE ON srch_index
  FOR EACH ROW EXECUTE FUNCTION srch_update_vector();

-- ── Search Query Log ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS srch_queries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  query        TEXT NOT NULL,
  source       TEXT,
  results_count INTEGER NOT NULL DEFAULT 0,
  clicked_id   UUID,
  session_id   TEXT,
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  country      TEXT,
  lang         TEXT DEFAULT 'ht',
  took_ms      INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Search Suggestions / Autocomplete ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS srch_suggestions (
  term         TEXT NOT NULL,
  source       TEXT NOT NULL DEFAULT 'all',
  count        INTEGER NOT NULL DEFAULT 1,
  lang         TEXT NOT NULL DEFAULT 'ht',
  PRIMARY KEY (term, source, lang)
);

-- ── Trending Searches ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS srch_trending (
  date         DATE NOT NULL,
  country      TEXT NOT NULL DEFAULT 'HT',
  lang         TEXT NOT NULL DEFAULT 'ht',
  query        TEXT NOT NULL,
  count        INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (date, country, query)
);

-- ── Search Analytics ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS srch_analytics (
  date             DATE NOT NULL,
  source           TEXT NOT NULL,
  total_searches   INTEGER NOT NULL DEFAULT 0,
  zero_results     INTEGER NOT NULL DEFAULT 0,
  total_clicks     INTEGER NOT NULL DEFAULT 0,
  avg_results      NUMERIC(8,2) DEFAULT 0,
  avg_took_ms      NUMERIC(8,2) DEFAULT 0,
  PRIMARY KEY (date, source)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- GIN for full-text search
CREATE INDEX IF NOT EXISTS idx_srch_fts        ON srch_index USING GIN(search_vector);
-- GIN trigram for fuzzy search on title
CREATE INDEX IF NOT EXISTS idx_srch_trgm_title ON srch_index USING GIN(title gin_trgm_ops);
-- Source filter
CREATE INDEX IF NOT EXISTS idx_srch_source     ON srch_index(source, is_available, updated_at DESC);
-- Geo filter (basic lat/lng)
CREATE INDEX IF NOT EXISTS idx_srch_geo        ON srch_index(lat, lng) WHERE lat IS NOT NULL;
-- Country filter
CREATE INDEX IF NOT EXISTS idx_srch_country    ON srch_index(country, source);
-- Query log
CREATE INDEX IF NOT EXISTS idx_srch_queries    ON srch_queries(created_at DESC, user_id);
-- Suggestions prefix search
CREATE INDEX IF NOT EXISTS idx_srch_suggest    ON srch_suggestions USING GIN(term gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_srch_trending   ON srch_trending(date DESC, country, count DESC);

-- ── Seed initial suggestions ──────────────────────────────────────────────────
INSERT INTO srch_suggestions (term, source, count, lang) VALUES
  ('Electrician',    'workers', 100, 'en'),
  ('Plumber',        'workers', 90,  'en'),
  ('Hotel',          'hotels',  200, 'en'),
  ('Restaurant',     'restaurants', 150, 'en'),
  ('Doctor',         'hospitals', 80, 'en'),
  ('Lawyer',         'services', 60, 'en'),
  ('Driver',         'workers', 120, 'en'),
  ('Construction',   'jobs',    110, 'en'),
  ('Nursing',        'jobs',    70,  'en'),
  ('Electricien',    'workers', 100, 'ht'),
  ('Plonbye',        'workers', 90,  'ht'),
  ('Otèl',           'hotels',  200, 'ht'),
  ('Restoran',       'restaurants', 150, 'ht'),
  ('Doktè',          'hospitals', 80, 'ht'),
  ('Avoka',          'services', 60, 'ht'),
  ('Chofè',          'workers', 120, 'ht'),
  ('Konstriksyon',   'jobs',    110, 'ht'),
  ('Enfimye',        'jobs',    70,  'ht')
ON CONFLICT DO NOTHING;