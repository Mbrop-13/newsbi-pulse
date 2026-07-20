-- ═══════════════════════════════════════════════
-- Maverlang — RPC atómicas para contadores de TOKENS
--
-- Resuelve M-11 (TOCTOU en check-limits.ts).
-- El patrón read-then-write del cliente permitía bypass de cuota con
-- requests concurrentes (dos pestañas leyendo N, ambas escriben N+1).
-- Estas RPC usan INSERT ... ON CONFLICT DO UPDATE SET x = x + N que es
-- atómico a nivel de BD.
--
-- Ejecutar DESPUÉS de supabase-rpc-functions.sql
--
-- SECURITY (OWASP ASVS 4.3.3):
--   • SECURITY DEFINER + SET search_path = public, pg_temp
--   • Identidad del caller forzada vía auth.uid() (no acepta p_user_id)
--   • REVOKE ALL de PUBLIC/anon; GRANT EXECUTE a authenticated
-- ═══════════════════════════════════════════════

-- ─── Incremento atómico de tokens mensuales (usuarios autenticados) ───
CREATE OR REPLACE FUNCTION increment_monthly_tokens(p_month DATE, p_tokens BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF p_tokens IS NULL OR p_tokens < 0 THEN
    RAISE EXCEPTION 'invalid token count';
  END IF;
  INSERT INTO monthly_usage (user_id, month, ai_tokens)
  VALUES (auth.uid(), p_month, p_tokens)
  ON CONFLICT (user_id, month)
  DO UPDATE SET ai_tokens = monthly_usage.ai_tokens + p_tokens;
END;
$$;

-- ─── Incremento atómico de tokens de por vida (usuarios autenticados) ───
CREATE OR REPLACE FUNCTION increment_lifetime_tokens(p_tokens BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF p_tokens IS NULL OR p_tokens < 0 THEN
    RAISE EXCEPTION 'invalid token count';
  END IF;
  INSERT INTO lifetime_usage (user_id, ai_tokens_total)
  VALUES (auth.uid(), p_tokens)
  ON CONFLICT (user_id)
  DO UPDATE SET ai_tokens_total = lifetime_usage.ai_tokens_total + p_tokens;
END;
$$;

-- ─── Registro de tokens con log temporal (ventana 5h / semanal) ───
-- Una sola RPC atómica para insertar el log de uso. La consulta de ventanas
-- se mantiene en check-limits.ts (es SELECT, no necesita atomicidad).
CREATE OR REPLACE FUNCTION log_token_usage(p_tokens BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF p_tokens IS NULL OR p_tokens < 0 THEN
    RAISE EXCEPTION 'invalid token count';
  END IF;
  INSERT INTO token_usage_logs (user_id, tokens)
  VALUES (auth.uid(), p_tokens);
  -- Purgar logs >7 días inline para no depender de un cron aparte
  DELETE FROM token_usage_logs
  WHERE user_id = auth.uid()
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- ─── Incremento atómico de tokens para INVITADOS (guest_usage) ───
-- Los guests no tienen auth.uid(); se identifican por IP hasheada (ver M-14).
-- Esta RPC es SECURITY DEFINER y acepta explícitamente p_ip_hash porque el
-- caller es el servidor (service_role), NO el cliente del navegador. Se
-- marca como "no segura para llamada directa desde cliente anónimo": la
-- protegemos exigiendo que el caller sea service_role.
CREATE OR REPLACE FUNCTION increment_guest_tokens(p_ip_hash TEXT, p_tokens BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Sólo service_role puede llamar esto (no auth.uid() disponible para guests)
  IF current_setting('role', true) <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden: service_role required';
  END IF;
  IF p_ip_hash IS NULL OR length(p_ip_hash) < 32 THEN
    RAISE EXCEPTION 'invalid ip hash';
  END IF;
  IF p_tokens IS NULL OR p_tokens < 0 THEN
    RAISE EXCEPTION 'invalid token count';
  END IF;
  INSERT INTO guest_usage (ip_address, ai_tokens_total, updated_at)
  VALUES (p_ip_hash, p_tokens, NOW())
  ON CONFLICT (ip_address)
  DO UPDATE SET
    ai_tokens_total = guest_usage.ai_tokens_total + p_tokens,
    updated_at = NOW();
END;
$$;

-- ─── Incremento atómico de mensajes AI para INVITADOS ───
CREATE OR REPLACE FUNCTION increment_guest_ai_message(p_ip_hash TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_setting('role', true) <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden: service_role required';
  END IF;
  IF p_ip_hash IS NULL OR length(p_ip_hash) < 32 THEN
    RAISE EXCEPTION 'invalid ip hash';
  END IF;
  INSERT INTO guest_usage (ip_address, ai_messages_total, updated_at)
  VALUES (p_ip_hash, 1, NOW())
  ON CONFLICT (ip_address)
  DO UPDATE SET
    ai_messages_total = guest_usage.ai_messages_total + 1,
    updated_at = NOW();
END;
$$;

-- ─── Permisos ───
REVOKE ALL ON FUNCTION increment_monthly_tokens(DATE, BIGINT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION increment_lifetime_tokens(BIGINT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION log_token_usage(BIGINT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION increment_guest_tokens(TEXT, BIGINT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION increment_guest_ai_message(TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION increment_monthly_tokens(DATE, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_lifetime_tokens(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_token_usage(BIGINT) TO authenticated;
-- guest_* sólo service_role (implícito; service_role bypasses GRANT/REVOKE)
