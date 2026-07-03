-- =====================================================================
-- Maverlang — Programa de Referidos (gamificado por niveles)
-- Aplica este script en el SQL Editor de Supabase.
-- Las políticas RLS owner-only coinciden con supabase-rls-audit.sql.
-- El código funciona sin estas tablas (devuelve empty/graceful) y se
-- activa al aplicar esta migración.
-- =====================================================================

-- 1) referral_codes: código único por usuario
CREATE TABLE IF NOT EXISTS referral_codes (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) referrals: vínculo referrer -> referred (un referido por usuario)
CREATE TABLE IF NOT EXISTS referrals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','qualified')),
  signup_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  qualified_at   TIMESTAMPTZ,
  reward_granted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- 3) referral_rewards: ledger de recompensas otorgadas (idempotencia + badges)
CREATE TABLE IF NOT EXISTS referral_rewards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id  UUID REFERENCES referrals(id) ON DELETE SET NULL,
  type         TEXT NOT NULL CHECK (type IN ('base','milestone')),
  days_granted INTEGER NOT NULL,
  milestone    INTEGER,
  badge        TEXT,
  granted_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rewards_user ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_milestone ON referral_rewards(user_id, milestone);

-- ============ RLS ============
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Owner-only SELECT en las tres tablas. Las escrituras las hace el
-- service-role (bypassa RLS) desde los endpoints de servidor.
DROP POLICY IF EXISTS "owner select referral_codes" ON referral_codes;
CREATE POLICY "owner select referral_codes" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner select referrals" ON referrals;
CREATE POLICY "owner select referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "owner select referral_rewards" ON referral_rewards;
CREATE POLICY "owner select referral_rewards" ON referral_rewards
  FOR SELECT USING (auth.uid() = user_id);
