-- ═══════════════════════════════════════════════════════════════
-- Maverlang — RLS REMEDIATION (OWASP ASVS L3 — v2)
-- Replaces public-read policies that leaked PII with safe ones.
-- Idempotent: safe to re-run.
--
-- Run in Supabase SQL Editor AFTER supabase-rls-audit.sql
-- ═══════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────
-- A-3: PROFILES — remove `USING (true)` anon read.
-- Expose only a PUBLIC VIEW with non-PII columns; raw table is owner-only.
-- ────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
    -- Drop the overly-permissive policy
    DROP POLICY IF EXISTS "Profiles are publicly readable" ON profiles;

    -- Owner can read/write their own row
    DROP POLICY IF EXISTS "Users read own profile" ON profiles;
    CREATE POLICY "Users read own profile" ON profiles
      FOR SELECT USING (auth.uid() = id);

    -- Update policy already exists ("Users update own profile"); keep it.
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='profiles' AND policyname='Users update own profile'
    ) THEN
      CREATE POLICY "Users update own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    END IF;

    -- INSERT: user can create only their own row
    DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
    CREATE POLICY "Users insert own profile" ON profiles
      FOR INSERT WITH CHECK (auth.uid() = id);

    RAISE NOTICE 'profiles: PII exposure closed';
  END IF;
END $$;

-- Create a public-safe view exposing only non-PII columns.
-- Use `profiles_public` everywhere clients currently read `profiles` by id.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles'
    AND column_name IN ('id','full_name','avatar_url')
  ) THEN
    CREATE OR REPLACE VIEW profiles_public AS
    SELECT id, full_name, avatar_url FROM profiles;

    -- Public read on the safe view (RLS bypassed via SECURITY DEFINER view bound to service role is overkill;
    -- simple GRANT SELECT on the view is enough since view only exposes id/name/avatar).
    GRANT SELECT ON profiles_public TO anon, authenticated;
    RAISE NOTICE 'profiles_public view (id, full_name, avatar_url) granted to anon/authenticated';
  END IF;
END $$;

-- ────────────────────────────────────────────────
-- A-3: SHARED_CHAT_LINKS — only owner + explicit share consumers.
-- Replace `USING (true)` (leaked every shared AI answer) with owner-only.
-- Public consumption is mediated by server route /share/chat/[id].
-- ────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='shared_chat_links') THEN
    DROP POLICY IF EXISTS "Anyone can read shared chats" ON shared_chat_links;
    DROP POLICY IF EXISTS "Owner reads own shared_chat_links" ON shared_chat_links;
    CREATE POLICY "Owner reads own shared_chat_links" ON shared_chat_links
      FOR SELECT USING (auth.uid() = user_id);

    -- INSERT (own) — keep
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='shared_chat_links' AND policyname='Users create own shared_chat_links'
    ) THEN
      CREATE POLICY "Users create own shared_chat_links" ON shared_chat_links
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- DELETE (own)
    DROP POLICY IF EXISTS "Users delete own shared_chat_links" ON shared_chat_links;
    CREATE POLICY "Users delete own shared_chat_links" ON shared_chat_links
      FOR DELETE USING (auth.uid() = user_id);

    RAISE NOTICE 'shared_chat_links: anon enumeration closed';
  END IF;
END $$;

-- ────────────────────────────────────────────────
-- A-3: ARTICLE_COMMENTS — keep public read (intended UX).
-- But tighten: only authenticated users insert/delete (already enforced),
-- and prohibit mass enumeration by adding comment throttling at app layer (app-side concern).
-- (No change needed here besides a NOT-TRUE fallback for unauthenticated DELETE.)
-- ────────────────────────────────────────────────
-- (intentionally left public-read; documented risk accepted)

-- ────────────────────────────────────────────────
-- A-3: NEWS_ARTICLES — exclude draft/hidden rows from anon.
-- Add a column-conditional policy if `published` exists, else leave as-is.
-- ────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='news_articles' AND column_name='published'
  ) THEN
    DROP POLICY IF EXISTS "Anyone can read news" ON news_articles;
    DROP POLICY IF EXISTS "Public reads published news" ON news_articles;
    CREATE POLICY "Public reads published news" ON news_articles
      FOR SELECT USING (published = true);
    RAISE NOTICE 'news_articles: anon SELECT limited to published rows';
  END IF;
END $$;

-- ────────────────────────────────────────────────
-- A-4: Remove "Service role full access" anti-pattern policies.
-- service_role already bypasses RLS by design; these policies add nothing
-- except risk if the key is ever exposed through a non-service client.
-- ────────────────────────────────────────────────
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname LIKE 'Service role full access %'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    RAISE NOTICE 'Dropped % on %.%', pol.policyname, pol.schemaname, pol.tablename;
  END LOOP;
END $$;

-- ────────────────────────────────────────────────
-- PORTFOLIO_REPORTS — ensure RLS is enabled (was missing in some migrations).
-- ────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='portfolio_reports') THEN
    ALTER TABLE portfolio_reports ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users manage own portfolio_reports" ON portfolio_reports;
    CREATE POLICY "Users manage own portfolio_reports" ON portfolio_reports
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    RAISE NOTICE 'portfolio_reports: RLS enabled + owner-only policy';
  END IF;
END $$;

-- DONE
