-- ================================================
-- Phase 12: Supabase Migration for NewsBI Pulse
-- Run this in Supabase SQL Editor (Dashboard → SQL)
-- ================================================

-- 1. Assistant configuration per user
CREATE TABLE IF NOT EXISTS assistant_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT DEFAULT '',
  topics TEXT[] DEFAULT '{}',
  tickers JSONB DEFAULT '[]',
  interests JSONB DEFAULT '{}',
  tone TEXT DEFAULT 'Analítico',
  role TEXT DEFAULT 'Mentor Financiero',
  has_completed_setup BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Chat messages per user
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. User bookmarks
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, article_id)
);

-- RLS Policies
ALTER TABLE assistant_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their config" ON assistant_configs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their messages" ON chat_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their bookmarks" ON user_bookmarks FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id, created_at);
CREATE INDEX idx_bookmarks_user ON user_bookmarks(user_id);
