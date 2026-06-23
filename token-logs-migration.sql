-- ═══════════════════════════════════════════════
-- Maverlang — Tabla de Logs de Uso de Tokens para Ventanas de Tiempo
-- Ejecuta este script en el editor SQL de Supabase
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.token_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- UUID de usuario o dirección IP para invitados
  tokens INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice compuesto para optimizar consultas de sumatoria en ventanas de tiempo
CREATE INDEX IF NOT EXISTS token_usage_logs_user_created_idx 
ON public.token_usage_logs (user_id, created_at);

-- Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.token_usage_logs ENABLE ROW LEVEL SECURITY;

-- Permitir acceso total al service_role
DROP POLICY IF EXISTS "Service role full access token_usage_logs" ON public.token_usage_logs;
CREATE POLICY "Service role full access token_usage_logs" ON public.token_usage_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Recargar esquema
NOTIFY pgrst, 'reload schema';
