-- ═══════════════════════════════════════════════════════════════
-- Reclu — Portfolio Reports Module
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Tabla principal de informes generados
CREATE TABLE IF NOT EXISTS public.portfolio_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  report_data jsonb NOT NULL DEFAULT '{}',
  symbols text[] NOT NULL DEFAULT '{}',
  model_used text DEFAULT 'deepseek/deepseek-v4-flash',
  generation_time_ms integer DEFAULT 0,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_portfolio_reports_user_id ON public.portfolio_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_reports_created_at ON public.portfolio_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_reports_user_created ON public.portfolio_reports(user_id, created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE public.portfolio_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own reports
CREATE POLICY "Users can view own reports"
  ON public.portfolio_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert (API generates reports)
CREATE POLICY "Service role can insert reports"
  ON public.portfolio_reports
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own reports (mark as read)
CREATE POLICY "Users can update own reports"
  ON public.portfolio_reports
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own reports
CREATE POLICY "Users can delete own reports"
  ON public.portfolio_reports
  FOR DELETE
  USING (auth.uid() = user_id);


-- 2. Tabla de preferencias de informes (día de la semana para el cron)
CREATE TABLE IF NOT EXISTS public.report_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_day smallint NOT NULL DEFAULT 1, -- 0=Domingo, 1=Lunes, 2=Martes... 6=Sábado
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_report_prefs_user ON public.report_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_report_prefs_day ON public.report_preferences(preferred_day) WHERE is_enabled = true;

-- RLS
ALTER TABLE public.report_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.report_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.report_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.report_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Agregar columna de conteo mensual de reportes a monthly_usage (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'monthly_usage'
      AND column_name = 'portfolio_reports'
  ) THEN
    ALTER TABLE public.monthly_usage ADD COLUMN portfolio_reports integer DEFAULT 0;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- ✅ Listo. Ahora puedes usar la API /api/portfolio-report
-- ═══════════════════════════════════════════════════════════════
