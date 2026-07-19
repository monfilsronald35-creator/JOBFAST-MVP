-- ============================================================
-- Migration 006: Auth columns for custom JWT auth (no Supabase Auth)
-- ============================================================
-- Supabase creates profiles.id as a FK to auth.users.
-- We remove that constraint so JOBFAST can insert profiles directly
-- using its own UUID generation (NOT through Supabase Auth).
-- ============================================================

-- 1. Drop FK constraint that ties profiles.id to auth.users
--    (safe: IF EXISTS means no error if already dropped or never existed)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Give id a default so INSERT without id works
ALTER TABLE public.profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Add password_hash for bcrypt-hashed passwords
--    (Supabase Auth stores credentials in auth.users; we store ours here)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 4. Ensure email has a UNIQUE constraint (needed for duplicate-check on register)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_email_key' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
END $$;

-- 5. Ensure email column exists (in case a minimal Supabase setup doesn't have it)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 6. Add phone if missing
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 7. Index on email for fast login lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- 8. Index on category + profession for matching service queries
CREATE INDEX IF NOT EXISTS idx_profiles_category ON public.profiles (category);
CREATE INDEX IF NOT EXISTS idx_profiles_profession ON public.profiles (profession);