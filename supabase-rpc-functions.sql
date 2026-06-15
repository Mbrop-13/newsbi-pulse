-- ═══════════════════════════════════════════════
-- Maverlang — RPC Functions for Usage Tracking
-- Run this AFTER the main migration
-- ═══════════════════════════════════════════════

-- Increment monthly AI messages
CREATE OR REPLACE FUNCTION increment_monthly_ai(p_user_id UUID, p_month DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO monthly_usage (user_id, month, ai_messages)
  VALUES (p_user_id, p_month, 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET ai_messages = monthly_usage.ai_messages + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment monthly TTS audios
CREATE OR REPLACE FUNCTION increment_monthly_tts(p_user_id UUID, p_month DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO monthly_usage (user_id, month, tts_audios)
  VALUES (p_user_id, p_month, 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET tts_audios = monthly_usage.tts_audios + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment daily TTS audios
CREATE OR REPLACE FUNCTION increment_daily_tts(p_user_id UUID, p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_usage (user_id, date, tts_audios)
  VALUES (p_user_id, p_date, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET tts_audios = daily_usage.tts_audios + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment lifetime AI messages
CREATE OR REPLACE FUNCTION increment_lifetime_ai(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO lifetime_usage (user_id, ai_messages_total)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET ai_messages_total = lifetime_usage.ai_messages_total + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
