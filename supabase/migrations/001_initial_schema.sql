-- MindReel Database Schema
-- Run this in your Supabase SQL editor or via migrations

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- INTERESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS interests (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'star',
  color TEXT NOT NULL DEFAULT '#818cf8',
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own interests"
  ON interests FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- SUB-INTERESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS sub_interests (
  id TEXT PRIMARY KEY,
  interest_id TEXT NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sub_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sub_interests"
  ON sub_interests FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FEEDS
-- ============================================================
CREATE TABLE IF NOT EXISTS feeds (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'layers',
  is_combined BOOLEAN NOT NULL DEFAULT false,
  shuffle_mode BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feeds"
  ON feeds FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FEED FILTERS (what each feed includes)
-- ============================================================
CREATE TABLE IF NOT EXISTS feed_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id TEXT NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  interest_id TEXT NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  sub_interest_ids TEXT[] DEFAULT '{}',
  levels TEXT[] DEFAULT '{beginner,intermediate,advanced,research}',
  focuses TEXT[] DEFAULT '{applied,theoretical,tutorial,news,entertainment}',
  media_types TEXT[] DEFAULT '{video,article,paper,discussion,podcast,short}',
  weight REAL NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE feed_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feed_filters"
  ON feed_filters FOR ALL
  USING (
    EXISTS (SELECT 1 FROM feeds WHERE feeds.id = feed_filters.feed_id AND feeds.user_id = auth.uid())
  );

-- ============================================================
-- CONTENT SOURCES (configured pipelines)
-- ============================================================
CREATE TABLE IF NOT EXISTS content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('youtube','reddit','arxiv','rss','hackernews','podcast','devto','wikipedia')),
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  interest_ids TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own content_sources"
  ON content_sources FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- CONTENT ITEMS (aggregated content)
-- ============================================================
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('video','article','paper','discussion','podcast','short')),
  duration INTEGER, -- seconds
  author TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, source_type, source_id)
);

ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own content_items"
  ON content_items FOR ALL USING (auth.uid() = user_id);

-- Index for fast feed queries
CREATE INDEX idx_content_items_user ON content_items(user_id, fetched_at DESC);
CREATE INDEX idx_content_items_media ON content_items(user_id, media_type);

-- ============================================================
-- CONTENT TAGS (maps content → interests/levels)
-- ============================================================
CREATE TABLE IF NOT EXISTS content_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  interest_id TEXT NOT NULL,
  sub_interest_id TEXT,
  level TEXT NOT NULL DEFAULT 'intermediate' CHECK (level IN ('beginner','intermediate','advanced','research')),
  focus TEXT NOT NULL DEFAULT 'news' CHECK (focus IN ('applied','theoretical','tutorial','news','entertainment')),
  confidence REAL NOT NULL DEFAULT 0.8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own content_tags"
  ON content_tags FOR ALL
  USING (
    EXISTS (SELECT 1 FROM content_items WHERE content_items.id = content_tags.content_id AND content_items.user_id = auth.uid())
  );

CREATE INDEX idx_content_tags_interest ON content_tags(interest_id, level, focus);
CREATE INDEX idx_content_tags_content ON content_tags(content_id);

-- ============================================================
-- USER INTERACTIONS (engagement tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('view','like','save','skip','share')),
  watch_duration INTEGER, -- seconds
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own interactions"
  ON user_interactions FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_interactions_user ON user_interactions(user_id, action);
CREATE INDEX idx_interactions_content ON user_interactions(content_id);

-- ============================================================
-- HELPER VIEW: Feed content query
-- ============================================================
CREATE OR REPLACE VIEW feed_content AS
SELECT
  ci.id,
  ci.user_id,
  ci.source_type,
  ci.source_id,
  ci.url,
  ci.title,
  ci.description,
  ci.thumbnail_url,
  ci.media_type,
  ci.duration,
  ci.author,
  ci.published_at,
  ci.fetched_at,
  ct.interest_id,
  ct.sub_interest_id,
  ct.level,
  ct.focus,
  ct.confidence
FROM content_items ci
JOIN content_tags ct ON ct.content_id = ci.id;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER feeds_updated_at
  BEFORE UPDATE ON feeds FOR EACH ROW EXECUTE FUNCTION update_updated_at();
