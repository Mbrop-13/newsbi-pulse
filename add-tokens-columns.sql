-- ═══════════════════════════════════════════════
-- Reclu — Agregar columnas de tracking de tokens
-- Ejecuta este script en el editor SQL de Supabase
-- ═══════════════════════════════════════════════

-- 1. Agregar columna ai_tokens a la tabla monthly_usage
ALTER TABLE public.monthly_usage 
ADD COLUMN IF NOT EXISTS ai_tokens INT DEFAULT 0;

-- 2. Agregar columna ai_tokens_total a la tabla lifetime_usage
ALTER TABLE public.lifetime_usage 
ADD COLUMN IF NOT EXISTS ai_tokens_total INT DEFAULT 0;

-- 3. Recargar el esquema para asegurar que PostgREST actualice la caché de las columnas
NOTIFY pgrst, 'reload schema';
