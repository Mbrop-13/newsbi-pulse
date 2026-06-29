-- ═══════════════════════════════════════════════
-- Maverlang — RPC Functions for Usage Tracking
-- Run this AFTER the main migration
--
-- SECURITY (OWASP ASVS 4.1.3 / 4.3.3 — v2):
--   • SECURITY DEFINER + SET search_path = public, pg_temp
--     (prevents pg_temp search_path hijacking)
--   • No p_user_id param: caller identity enforced via auth.uid()
--     (prevents cross-user quota manipulation)
--   • REVOKE ALL from public/anon; GRANT EXECUTE to authenticated only
-- ═══════════════════════════════════════════════

-- ────────────────────────────────────────────────
-- Backwards-compatible wrappers: keep old signatures
-- (p_user_id, p_month) but ignore p_user_id and use auth.uid().
-- Drop & recreate to apply SET search_path.
-- ────────────────────────────────────────────────

-- Increment monthly AI messages
CREATE OR REPLACE FUNCTION increment_monthly_ai(p_user_id UUID, p_month DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  INSERT INTO monthly_usage (user_id, month, ai_messages)
  VALUES (auth.uid(), p_month, 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET ai_messages = monthly_usage.ai_messages + 1;
END;
$$;

-- Increment monthly TTS audios
CREATE OR REPLACE FUNCTION increment_monthly_tts(p_user_id UUID, p_month DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  INSERT INTO monthly_usage (user_id, month, tts_audios)
  VALUES (auth.uid(), p_month, 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET tts_audios = monthly_usage.tts_audios + 1;
END;
$$;

-- Increment daily TTS audios
CREATE OR REPLACE FUNCTION increment_daily_tts(p_user_id UUID, p_date DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  INSERT INTO daily_usage (user_id, date, tts_audios)
  VALUES (auth.uid(), p_date, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET tts_audios = daily_usage.tts_audios + 1;
END;
$$;

-- Increment lifetime AI messages
CREATE OR REPLACE FUNCTION increment_lifetime_ai(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  INSERT INTO lifetime_usage (user_id, ai_messages_total)
  VALUES (auth.uid(), 1)
  ON CONFLICT (user_id)
  DO UPDATE SET ai_messages_total = lifetime_usage.ai_messages_total + 1;
END;
$$;

-- ────────────────────────────────────────────────
-- REVOKE: only authenticated roles may execute.
-- The service_role bypasses GRANT/REVOKE anyway.
-- ────────────────────────────────────────────────
REVOKE ALL ON FUNCTION increment_monthly_ai(UUID, DATE) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION increment_monthly_tts(UUID, DATE) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION increment_daily_tts(UUID, DATE) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION increment_lifetime_ai(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION increment_monthly_ai(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_monthly_tts(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_daily_tts(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_lifetime_ai(UUID) TO authenticated;
