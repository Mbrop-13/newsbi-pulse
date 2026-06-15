-- ═══════════════════════════════════════════════════════════════
-- Maverlang — RLS Audit (safe version — skips non-existent tables)
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
BEGIN
  -- Enable RLS on all tables that exist
  FOR tbl IN
    SELECT unnest(ARRAY[
      'portfolios','price_alerts','user_bookmarks','user_preferences',
      'user_diamonds','user_bets','user_ai_calendar','ai_saved_chats',
      'chat_messages','shared_chat_links','notifications',
      'support_tickets','support_messages','article_comments',
      'referral_codes','referrals','referral_rewards','profiles',
      'assistant_configs','predictions','admin_users',
      'news_articles','pipeline_runs','ai_pipeline_logs',
      'subscriptions','monthly_usage','daily_usage','lifetime_usage'
    ])
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      RAISE NOTICE 'RLS enabled on %', tbl;
    ELSE
      RAISE NOTICE 'SKIPPED (not found): %', tbl;
    END IF;
  END LOOP;
END $$;

-- ══════════════════════════════════════════════
-- USER-OWNED TABLES (auth.uid() = user_id)
-- ══════════════════════════════════════════════

-- Portfolios
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='portfolios') THEN
    DROP POLICY IF EXISTS "Users manage own portfolios" ON portfolios;
    CREATE POLICY "Users manage own portfolios" ON portfolios FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Service role full access portfolios" ON portfolios;
    CREATE POLICY "Service role full access portfolios" ON portfolios FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Price Alerts
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='price_alerts') THEN
    DROP POLICY IF EXISTS "Users manage own price_alerts" ON price_alerts;
    CREATE POLICY "Users manage own price_alerts" ON price_alerts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Service role full access price_alerts" ON price_alerts;
    CREATE POLICY "Service role full access price_alerts" ON price_alerts FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Bookmarks
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_bookmarks') THEN
    DROP POLICY IF EXISTS "Users manage own bookmarks" ON user_bookmarks;
    CREATE POLICY "Users manage own bookmarks" ON user_bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Service role full access user_bookmarks" ON user_bookmarks;
    CREATE POLICY "Service role full access user_bookmarks" ON user_bookmarks FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Preferences
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_preferences') THEN
    DROP POLICY IF EXISTS "Users manage own preferences" ON user_preferences;
    CREATE POLICY "Users manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Service role full access user_preferences" ON user_preferences;
    CREATE POLICY "Service role full access user_preferences" ON user_preferences FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Diamonds
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_diamonds') THEN
    DROP POLICY IF EXISTS "Users read own diamonds" ON user_diamonds;
    CREATE POLICY "Users read own diamonds" ON user_diamonds FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Service role full access user_diamonds" ON user_diamonds;
    CREATE POLICY "Service role full access user_diamonds" ON user_diamonds FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Bets
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_bets') THEN
    DROP POLICY IF EXISTS "Users manage own bets" ON user_bets;
    CREATE POLICY "Users manage own bets" ON user_bets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Service role full access user_bets" ON user_bets;
    CREATE POLICY "Service role full access user_bets" ON user_bets FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- AI Calendar
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_ai_calendar') THEN
    DROP POLICY IF EXISTS "Users manage own ai_calendar" ON user_ai_calendar;
    CREATE POLICY "Users manage own ai_calendar" ON user_ai_calendar FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Service role full access user_ai_calendar" ON user_ai_calendar;
    CREATE POLICY "Service role full access user_ai_calendar" ON user_ai_calendar FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Saved Chats
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ai_saved_chats') THEN
    DROP POLICY IF EXISTS "Users manage own saved_chats" ON ai_saved_chats;
    CREATE POLICY "Users manage own saved_chats" ON ai_saved_chats FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Service role full access ai_saved_chats" ON ai_saved_chats;
    CREATE POLICY "Service role full access ai_saved_chats" ON ai_saved_chats FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Chat Messages
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='chat_messages') THEN
    DROP POLICY IF EXISTS "Users manage own chat_messages" ON chat_messages;
    CREATE POLICY "Users manage own chat_messages" ON chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Service role full access chat_messages" ON chat_messages;
    CREATE POLICY "Service role full access chat_messages" ON chat_messages FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Notifications
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notifications') THEN
    DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
    CREATE POLICY "Users manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Service role full access notifications" ON notifications;
    CREATE POLICY "Service role full access notifications" ON notifications FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Support Tickets
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='support_tickets') THEN
    DROP POLICY IF EXISTS "Users manage own tickets" ON support_tickets;
    CREATE POLICY "Users manage own tickets" ON support_tickets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Service role full access support_tickets" ON support_tickets;
    CREATE POLICY "Service role full access support_tickets" ON support_tickets FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Support Messages
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='support_messages') THEN
    DROP POLICY IF EXISTS "Users manage own support_messages" ON support_messages;
    CREATE POLICY "Users manage own support_messages" ON support_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Service role full access support_messages" ON support_messages;
    CREATE POLICY "Service role full access support_messages" ON support_messages FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Assistant Configs
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='assistant_configs') THEN
    DROP POLICY IF EXISTS "Users manage own assistant_configs" ON assistant_configs;
    CREATE POLICY "Users manage own assistant_configs" ON assistant_configs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Service role full access assistant_configs" ON assistant_configs;
    CREATE POLICY "Service role full access assistant_configs" ON assistant_configs FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Referral Codes
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='referral_codes') THEN
    DROP POLICY IF EXISTS "Users read own referral_codes" ON referral_codes;
    CREATE POLICY "Users read own referral_codes" ON referral_codes FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Service role full access referral_codes" ON referral_codes;
    CREATE POLICY "Service role full access referral_codes" ON referral_codes FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Referrals
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='referrals') THEN
    DROP POLICY IF EXISTS "Users read own referrals" ON referrals;
    CREATE POLICY "Users read own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
    DROP POLICY IF EXISTS "Service role full access referrals" ON referrals;
    CREATE POLICY "Service role full access referrals" ON referrals FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Referral Rewards
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='referral_rewards') THEN
    DROP POLICY IF EXISTS "Users read own referral_rewards" ON referral_rewards;
    CREATE POLICY "Users read own referral_rewards" ON referral_rewards FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Service role full access referral_rewards" ON referral_rewards;
    CREATE POLICY "Service role full access referral_rewards" ON referral_rewards FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ══════════════════════════════════════════════
-- PUBLIC READ TABLES
-- ══════════════════════════════════════════════

-- Profiles (public read, own write)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
    DROP POLICY IF EXISTS "Profiles are publicly readable" ON profiles;
    CREATE POLICY "Profiles are publicly readable" ON profiles FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Users update own profile" ON profiles;
    CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    DROP POLICY IF EXISTS "Service role full access profiles" ON profiles;
    CREATE POLICY "Service role full access profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Shared Chat Links (public read, own create)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='shared_chat_links') THEN
    DROP POLICY IF EXISTS "Anyone can read shared chats" ON shared_chat_links;
    CREATE POLICY "Anyone can read shared chats" ON shared_chat_links FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Users create own shared_chat_links" ON shared_chat_links;
    CREATE POLICY "Users create own shared_chat_links" ON shared_chat_links FOR INSERT WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Service role full access shared_chat_links" ON shared_chat_links;
    CREATE POLICY "Service role full access shared_chat_links" ON shared_chat_links FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Article Comments (public read, own write/delete)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='article_comments') THEN
    DROP POLICY IF EXISTS "Anyone can read comments" ON article_comments;
    CREATE POLICY "Anyone can read comments" ON article_comments FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Users create own comments" ON article_comments;
    CREATE POLICY "Users create own comments" ON article_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users delete own comments" ON article_comments;
    CREATE POLICY "Users delete own comments" ON article_comments FOR DELETE USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Service role full access article_comments" ON article_comments;
    CREATE POLICY "Service role full access article_comments" ON article_comments FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Predictions (public read)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='predictions') THEN
    DROP POLICY IF EXISTS "Anyone can read predictions" ON predictions;
    CREATE POLICY "Anyone can read predictions" ON predictions FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Service role full access predictions" ON predictions;
    CREATE POLICY "Service role full access predictions" ON predictions FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- News Articles (public read)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='news_articles') THEN
    DROP POLICY IF EXISTS "Anyone can read news" ON news_articles;
    CREATE POLICY "Anyone can read news" ON news_articles FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Service role full access news_articles" ON news_articles;
    CREATE POLICY "Service role full access news_articles" ON news_articles FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ══════════════════════════════════════════════
-- ADMIN/INTERNAL TABLES
-- ══════════════════════════════════════════════

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='admin_users') THEN
    DROP POLICY IF EXISTS "Admin table service_role only" ON admin_users;
    CREATE POLICY "Admin table service_role only" ON admin_users FOR ALL USING (auth.role() = 'service_role');
    DROP POLICY IF EXISTS "Admins read own row" ON admin_users;
    CREATE POLICY "Admins read own row" ON admin_users FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pipeline_runs') THEN
    DROP POLICY IF EXISTS "Pipeline runs service_role only" ON pipeline_runs;
    CREATE POLICY "Pipeline runs service_role only" ON pipeline_runs FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ai_pipeline_logs') THEN
    DROP POLICY IF EXISTS "AI pipeline logs service_role only" ON ai_pipeline_logs;
    CREATE POLICY "AI pipeline logs service_role only" ON ai_pipeline_logs FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- DONE
