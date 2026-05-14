-- ═══════════════════════════════════════════════════════════════
-- Reclu — RLS (Row Level Security) Audit & Hardening
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. ENABLE RLS ON ALL TABLES
ALTER TABLE IF EXISTS portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portfolio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_diamonds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_ai_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_saved_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shared_chat_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assistant_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_pipeline_logs ENABLE ROW LEVEL SECURITY;

-- 2. USER-OWNED TABLES (users only see their own data)
DROP POLICY IF EXISTS "Users manage own portfolios" ON portfolios;
CREATE POLICY "Users manage own portfolios" ON portfolios
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own portfolio_assets" ON portfolio_assets;
CREATE POLICY "Users manage own portfolio_assets" ON portfolio_assets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own price_alerts" ON price_alerts;
CREATE POLICY "Users manage own price_alerts" ON price_alerts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own bookmarks" ON user_bookmarks;
CREATE POLICY "Users manage own bookmarks" ON user_bookmarks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own preferences" ON user_preferences;
CREATE POLICY "Users manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own diamonds" ON user_diamonds;
CREATE POLICY "Users read own diamonds" ON user_diamonds
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own bets" ON user_bets;
CREATE POLICY "Users manage own bets" ON user_bets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own ai_calendar" ON user_ai_calendar;
CREATE POLICY "Users manage own ai_calendar" ON user_ai_calendar
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own saved_chats" ON ai_saved_chats;
CREATE POLICY "Users manage own saved_chats" ON ai_saved_chats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own chat_messages" ON chat_messages;
CREATE POLICY "Users manage own chat_messages" ON chat_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
CREATE POLICY "Users manage own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own tickets" ON support_tickets;
CREATE POLICY "Users manage own tickets" ON support_tickets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own support_messages" ON support_messages;
CREATE POLICY "Users manage own support_messages" ON support_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own referral_codes" ON referral_codes;
CREATE POLICY "Users read own referral_codes" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own referrals" ON referrals;
CREATE POLICY "Users read own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "Users read own referral_rewards" ON referral_rewards;
CREATE POLICY "Users read own referral_rewards" ON referral_rewards
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users manage own assistant_configs" ON assistant_configs;
CREATE POLICY "Users manage own assistant_configs" ON assistant_configs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. PUBLIC READ TABLES
DROP POLICY IF EXISTS "Profiles are publicly readable" ON profiles;
CREATE POLICY "Profiles are publicly readable" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read shared chats" ON shared_chat_links;
CREATE POLICY "Anyone can read shared chats" ON shared_chat_links
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users create own shared_chat_links" ON shared_chat_links;
CREATE POLICY "Users create own shared_chat_links" ON shared_chat_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read comments" ON article_comments;
CREATE POLICY "Anyone can read comments" ON article_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users create own comments" ON article_comments;
CREATE POLICY "Users create own comments" ON article_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own comments" ON article_comments;
CREATE POLICY "Users delete own comments" ON article_comments
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read predictions" ON predictions;
CREATE POLICY "Anyone can read predictions" ON predictions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read news" ON news_articles;
CREATE POLICY "Anyone can read news" ON news_articles
  FOR SELECT USING (true);

-- 4. ADMIN/INTERNAL TABLES
DROP POLICY IF EXISTS "Admin table service_role only" ON admin_users;
CREATE POLICY "Admin table service_role only" ON admin_users
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins read own row" ON admin_users;
CREATE POLICY "Admins read own row" ON admin_users
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Pipeline runs service_role only" ON pipeline_runs;
CREATE POLICY "Pipeline runs service_role only" ON pipeline_runs
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "AI pipeline logs service_role only" ON ai_pipeline_logs;
CREATE POLICY "AI pipeline logs service_role only" ON ai_pipeline_logs
  FOR ALL USING (auth.role() = 'service_role');

-- 5. SERVICE ROLE FULL ACCESS
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'portfolios','portfolio_assets','price_alerts',
      'user_bookmarks','user_preferences','user_diamonds',
      'user_bets','user_ai_calendar','ai_saved_chats',
      'chat_messages','shared_chat_links','notifications',
      'support_tickets','support_messages','article_comments',
      'referral_codes','referrals','referral_rewards',
      'profiles','assistant_configs','predictions','news_articles'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Service role full access %s" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Service role full access %s" ON %I FOR ALL USING (auth.role() = ''service_role'')', tbl, tbl);
  END LOOP;
END $$;
