import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(supabaseUrl, serviceRoleKey);
}

/*
── Supabase SQL Schema ─────────────────────────────

CREATE TABLE IF NOT EXISTS news_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  enriched_content TEXT,
  original_source TEXT,
  source_url TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  author TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_live BOOLEAN DEFAULT FALSE,
  live_youtube_url TEXT,
  audio_url TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  relevance_score FLOAT DEFAULT 0.5,
  embedding VECTOR(384)
);

CREATE INDEX idx_news_category ON news_articles(category);
CREATE INDEX idx_news_published ON news_articles(published_at DESC);
CREATE INDEX idx_news_group ON news_articles(group_id);
CREATE INDEX idx_news_live ON news_articles(is_live) WHERE is_live = TRUE;

── Enable pgvector extension for embeddings ──
CREATE EXTENSION IF NOT EXISTS vector;

*/
