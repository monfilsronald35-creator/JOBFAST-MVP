-- Migration 007: Extended profile columns for business / reputation / marketplace data
-- Run this in the Supabase SQL Editor BEFORE deploying the migrated backend.
-- All columns use IF NOT EXISTS so the migration is safe to re-run.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_data     JSONB            NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS enterprise_data  JSONB            NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reputation_data  JSONB            NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS marketplace_data JSONB            NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS verified         BOOLEAN          NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trust_score      INTEGER          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS availability     TEXT             NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS experience       INTEGER          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS location_lat     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS stats            JSONB            NOT NULL DEFAULT '{}';

-- Indexes for the new columns most likely to appear in WHERE / ORDER BY clauses
CREATE INDEX IF NOT EXISTS profiles_verified_idx       ON public.profiles (verified);
CREATE INDEX IF NOT EXISTS profiles_trust_score_idx    ON public.profiles (trust_score DESC);
CREATE INDEX IF NOT EXISTS profiles_availability_idx   ON public.profiles (availability);
CREATE INDEX IF NOT EXISTS profiles_account_status_idx ON public.profiles (account_status);
CREATE INDEX IF NOT EXISTS profiles_location_lat_idx   ON public.profiles (location_lat);
CREATE INDEX IF NOT EXISTS profiles_location_lng_idx   ON public.profiles (location_lng);