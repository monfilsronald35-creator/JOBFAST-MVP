-- ============================================================
-- JOBFAST — Migration 002: Social Tables
-- Run in: Supabase SQL Editor (after 001)
-- Tables: posts, post_likes, post_comments, user_follows
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- POSTS
-- Photo, video, promotion, or text posts on user profiles.
-- Likes and comments stored in separate junction tables
-- (not embedded arrays) for efficient querying.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type           TEXT NOT NULL DEFAULT 'photo'
                   CHECK (type IN ('photo','video','promotion','text')),
  media_url      TEXT NOT NULL DEFAULT '',
  thumbnail_url  TEXT NOT NULL DEFAULT '',
  caption        TEXT NOT NULL DEFAULT '' CHECK (char_length(caption) <= 500),
  audience       TEXT NOT NULL DEFAULT 'public'
                   CHECK (audience IN ('public','followers','private')),
  likes_count    INT  NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INT  NOT NULL DEFAULT 0 CHECK (comments_count >= 0),
  duration       INT,          -- seconds, for video posts
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_posts_user_created   ON posts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_audience        ON posts (audience, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- POST LIKES
-- Composite PK ensures one like per user per post.
-- Counter on posts.likes_count kept in sync by trigger.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_likes (
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- Keep likes_count in sync
CREATE OR REPLACE FUNCTION sync_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER post_likes_sync
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION sync_likes_count();

-- ─────────────────────────────────────────────────────────────
-- POST COMMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text       TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments (post_id, created_at DESC);

-- Keep comments_count in sync
CREATE OR REPLACE FUNCTION sync_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER post_comments_sync
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION sync_comments_count();

-- ─────────────────────────────────────────────────────────────
-- USER FOLLOWS
-- Replaces the MongoDB embedded arrays (following/followers).
-- Composite PK prevents duplicate follows.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_follows (
  follower_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)    -- cannot follow yourself
);

CREATE INDEX IF NOT EXISTS idx_follows_follower  ON user_follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON user_follows (following_id);