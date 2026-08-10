-- ═══════════════════════════════════════════════
-- Maverlang — RPC de tokens para SERVICE ROLE
--
-- Problema: check-limits.ts usa service_role (sin JWT). Las RPC
-- log_token_usage / increment_*_tokens usan auth.uid() → NULL → el contador
-- SEMANAL (token_usage_logs) no se actualizaba.
--
-- Estas RPC aceptan p_user_id y exigen auth.role() = service_role.
-- Ejecutar en el SQL Editor de Supabase.
-- ═══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION service_log_token_usage(p_user_id TEXT, p_tokens BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden: service_role required';
  END IF;
  IF p_user_id IS NULL OR length(trim(p_user_id)) < 1 THEN
    RAISE EXCEPTION 'invalid user id';
  END IF;
  IF p_tokens IS NULL OR p_tokens < 0 THEN
    RAISE EXCEPTION 'invalid token count';
  END IF;
  INSERT INTO token_usage_logs (user_id, tokens)
  VALUES (p_user_id, p_tokens);
  DELETE FROM token_usage_logs
  WHERE user_id = p_user_id
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$;

CREATE OR REPLACE FUNCTION service_increment_monthly_tokens(
  p_user_id UUID,
  p_month DATE,
  p_tokens BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden: service_role required';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid user id';
  END IF;
  IF p_tokens IS NULL OR p_tokens < 0 THEN
    RAISE EXCEPTION 'invalid token count';
  END IF;
  INSERT INTO monthly_usage (user_id, month, ai_tokens)
  VALUES (p_user_id, p_month, p_tokens)
  ON CONFLICT (user_id, month)
  DO UPDATE SET ai_tokens = monthly_usage.ai_tokens + p_tokens;
END;
$$;

CREATE OR REPLACE FUNCTION service_increment_lifetime_tokens(
  p_user_id UUID,
  p_tokens BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden: service_role required';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid user id';
  END IF;
  IF p_tokens IS NULL OR p_tokens < 0 THEN
    RAISE EXCEPTION 'invalid token count';
  END IF;
  INSERT INTO lifetime_usage (user_id, ai_tokens_total)
  VALUES (p_user_id, p_tokens)
  ON CONFLICT (user_id)
  DO UPDATE SET ai_tokens_total = lifetime_usage.ai_tokens_total + p_tokens;
END;
$$;

REVOKE ALL ON FUNCTION service_log_token_usage(TEXT, BIGINT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION service_increment_monthly_tokens(UUID, DATE, BIGINT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION service_increment_lifetime_tokens(UUID, BIGINT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION service_log_token_usage(TEXT, BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION service_increment_monthly_tokens(UUID, DATE, BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION service_increment_lifetime_tokens(UUID, BIGINT) TO service_role;

NOTIFY pgrst, 'reload schema';
