-- Maverlang / newsbi-pulse — RLS hardening for production (2026-09-07)
-- Run in Supabase SQL Editor (prod). Review before applying.
-- Goal: no USING (true) on PII tables; admin logs/support not readable by anon.

BEGIN;

-- ── Enable RLS on sensitive tables ──
ALTER TABLE IF EXISTS public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_saved_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_pipeline_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shared_chat_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_drive_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assistant_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.guest_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.monthly_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lifetime_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.token_usage_logs ENABLE ROW LEVEL SECURITY;

-- ── Pipeline logs: service role only (no client SELECT) ──
DROP POLICY IF EXISTS "ai_pipeline_logs_select_all" ON public.ai_pipeline_logs;
DROP POLICY IF EXISTS "Public read logs" ON public.ai_pipeline_logs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ai_pipeline_logs;

REVOKE ALL ON public.ai_pipeline_logs FROM anon, authenticated;
GRANT SELECT, INSERT ON public.ai_pipeline_logs TO service_role;

-- ── Support: users see own tickets; messages of own tickets ──
DROP POLICY IF EXISTS "support_tickets_select_all" ON public.support_tickets;
DROP POLICY IF EXISTS "support_messages_select_all" ON public.support_messages;

DROP POLICY IF EXISTS support_tickets_owner_select ON public.support_tickets;
CREATE POLICY support_tickets_owner_select
  ON public.support_tickets FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS support_tickets_owner_insert ON public.support_tickets;
CREATE POLICY support_tickets_owner_insert
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS support_tickets_owner_update ON public.support_tickets;
CREATE POLICY support_tickets_owner_update
  ON public.support_tickets FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS support_messages_own_ticket_select ON public.support_messages;
CREATE POLICY support_messages_own_ticket_select
  ON public.support_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS support_messages_own_ticket_insert ON public.support_messages;
CREATE POLICY support_messages_own_ticket_insert
  ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND is_admin = false
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

-- ── Portfolios / alerts: owner only ──
DROP POLICY IF EXISTS portfolios_owner_all ON public.portfolios;
CREATE POLICY portfolios_owner_all
  ON public.portfolios FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS price_alerts_owner_all ON public.price_alerts;
CREATE POLICY price_alerts_owner_all
  ON public.price_alerts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── Admin table: never readable by authenticated ──
REVOKE ALL ON public.admin_users FROM anon, authenticated;
GRANT SELECT ON public.admin_users TO service_role;

COMMIT;

-- Verify:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
-- SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public' ORDER BY 1, 2;
