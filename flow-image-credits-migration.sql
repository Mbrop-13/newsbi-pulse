-- ═══════════════════════════════════════════════════════════════
-- Flow image credits — server-side quota (security fix 2026-08)
-- Run in Supabase SQL Editor (production + staging).
-- Idempotent.
-- ═══════════════════════════════════════════════════════════════

-- 1. Column on monthly_usage
ALTER TABLE public.monthly_usage
  ADD COLUMN IF NOT EXISTS image_credits INT DEFAULT 0 NOT NULL;

COMMENT ON COLUMN public.monthly_usage.image_credits IS
  'Créditos de imagen Flow consumidos en el mes (server-side).';

-- 2. Atomic try-consume (called only from trusted server with service_role)
--    Locks the row, checks used + amount <= limit, then increments.
CREATE OR REPLACE FUNCTION public.try_consume_image_credits(
  p_user_id UUID,
  p_month DATE,
  p_amount INT,
  p_limit INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_used INT;
  v_new INT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'missing_user');
  END IF;
  IF p_amount IS NULL OR p_amount < 1 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'invalid_amount');
  END IF;
  IF p_limit IS NULL OR p_limit < 1 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'no_quota',
      'used', 0,
      'limit', COALESCE(p_limit, 0),
      'remaining', 0
    );
  END IF;

  INSERT INTO public.monthly_usage (user_id, month, image_credits)
  VALUES (p_user_id, p_month, 0)
  ON CONFLICT (user_id, month) DO NOTHING;

  SELECT COALESCE(image_credits, 0)
  INTO v_used
  FROM public.monthly_usage
  WHERE user_id = p_user_id AND month = p_month
  FOR UPDATE;

  IF v_used + p_amount > p_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'insufficient',
      'used', v_used,
      'limit', p_limit,
      'remaining', GREATEST(0, p_limit - v_used)
    );
  END IF;

  UPDATE public.monthly_usage
  SET image_credits = COALESCE(image_credits, 0) + p_amount
  WHERE user_id = p_user_id AND month = p_month
  RETURNING image_credits INTO v_new;

  RETURN jsonb_build_object(
    'allowed', true,
    'used', v_new,
    'limit', p_limit,
    'remaining', GREATEST(0, p_limit - v_new),
    'consumed', p_amount
  );
END;
$$;

-- 3. Refund (if fewer images generated than reserved)
CREATE OR REPLACE FUNCTION public.refund_image_credits(
  p_user_id UUID,
  p_month DATE,
  p_amount INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new INT;
BEGIN
  IF p_user_id IS NULL OR p_amount IS NULL OR p_amount < 1 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid');
  END IF;

  UPDATE public.monthly_usage
  SET image_credits = GREATEST(0, COALESCE(image_credits, 0) - p_amount)
  WHERE user_id = p_user_id AND month = p_month
  RETURNING image_credits INTO v_new;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  RETURN jsonb_build_object('ok', true, 'used', v_new, 'refunded', p_amount);
END;
$$;

REVOKE ALL ON FUNCTION public.try_consume_image_credits(UUID, DATE, INT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_image_credits(UUID, DATE, INT) FROM PUBLIC;
-- Service role / postgres can execute; app uses service_role client after requireUser.
GRANT EXECUTE ON FUNCTION public.try_consume_image_credits(UUID, DATE, INT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_image_credits(UUID, DATE, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.try_consume_image_credits(UUID, DATE, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_image_credits(UUID, DATE, INT) TO authenticated;
