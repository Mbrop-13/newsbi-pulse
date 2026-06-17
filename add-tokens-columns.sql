-- ═══════════════════════════════════════════════
-- Maverlang — Agregar columnas de tracking de tokens
-- Ejecuta este script en el editor SQL de Supabase
-- ═══════════════════════════════════════════════

-- 1. Agregar columna ai_tokens a la tabla monthly_usage
ALTER TABLE public.monthly_usage 
ADD COLUMN IF NOT EXISTS ai_tokens INT DEFAULT 0;

-- 2. Agregar columna ai_tokens_total a la tabla lifetime_usage
ALTER TABLE public.lifetime_usage 
ADD COLUMN IF NOT EXISTS ai_tokens_total INT DEFAULT 0;

-- 3. Crear tabla guest_usage para tracking de invitados por IP (evitando errores de UUID)
CREATE TABLE IF NOT EXISTS public.guest_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  ai_messages_total INT DEFAULT 0,
  ai_tokens_total INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en guest_usage
ALTER TABLE public.guest_usage ENABLE ROW LEVEL SECURITY;

-- Permitir acceso completo al service_role
DROP POLICY IF EXISTS "Service role full access guest_usage" ON public.guest_usage;
CREATE POLICY "Service role full access guest_usage" ON public.guest_usage
  FOR ALL USING (auth.role() = 'service_role');

-- 4. Crear tabla api_rate_limits para rate limiting distribuido en serverless
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  requests_count INT DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL
);

-- Habilitar RLS en api_rate_limits
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Permitir acceso completo al service_role
DROP POLICY IF EXISTS "Service role full access api_rate_limits" ON public.api_rate_limits;
CREATE POLICY "Service role full access api_rate_limits" ON public.api_rate_limits
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Recargar el esquema para asegurar que PostgREST actualice la caché de las columnas
NOTIFY pgrst, 'reload schema';


