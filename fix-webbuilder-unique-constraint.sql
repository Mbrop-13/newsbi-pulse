-- ═══════════════════════════════════════════════════════════════════════
-- FIX: Constraint UNIQUE faltante en ai_webbuilder_projects
-- ═══════════════════════════════════════════════════════════════════════
-- PROBLEMA:
--   syncToCloud() usa .upsert({ onConflict: "chat_id,user_id" }) (ver
--   webbuilder-store.ts → performCloudUpsert). Supabase responde 400:
--   "there is no unique or exclusion constraint matching the ON CONFLICT
--    specification"
--
-- CAUSA:
--   La tabla ai_webbuilder_projects existe en producción, pero el constraint
--   UNIQUE(chat_id, user_id) definido en supabase-webbuilder-migration.sql
--   NUNCA se ejecutó contra la BBDD de producción.
--
-- EJECUTAR EN: Supabase Dashboard → SQL Editor → New query
-- SEGURO: Es idempotente (DROP IF EXISTS antes de ADD).
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Eliminar filas duplicadas ANTES de crear el constraint.
--    Si ya hay duplicados de (chat_id, user_id), ADD CONSTRAINT fallaría.
--    Mantenemos la fila más reciente (mayor updated_at).
DELETE FROM public.ai_webbuilder_projects a
USING public.ai_webbuilder_projects b
WHERE a.ctid < b.ctid
  AND a.chat_id = b.chat_id
  AND a.user_id = b.user_id
  AND a.updated_at <= b.updated_at;

-- 2. Crear el constraint UNIQUE necesario para el upsert con ON CONFLICT.
ALTER TABLE public.ai_webbuilder_projects
  DROP CONSTRAINT IF EXISTS uq_ai_webbuilder_projects_chat_user;

ALTER TABLE public.ai_webbuilder_projects
  ADD CONSTRAINT uq_ai_webbuilder_projects_chat_user UNIQUE (chat_id, user_id);

-- 3. (Opcional) Índice de apoyo para búsquedas por chat_id.
CREATE INDEX IF NOT EXISTS idx_ai_webbuilder_projects_chat_id
  ON public.ai_webbuilder_projects(chat_id);

-- 4. Verificar que el constraint se creó correctamente.
--    Debe devolver una fila con el nombre del constraint.
SELECT con.conname AS constraint_name,
       pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'ai_webbuilder_projects'
  AND con.contype = 'u';
