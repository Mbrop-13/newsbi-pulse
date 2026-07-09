-- =============================================================================
-- Migración: Tabla ai_projects
-- Sección "Proyectos" de Maverlang — Hub centralizado de desarrollo
-- =============================================================================

-- Tabla principal de proyectos del usuario
CREATE TABLE IF NOT EXISTS public.ai_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Mi Proyecto',
    description TEXT DEFAULT '',
    -- Tipo de proyecto: 'web' (Sitio Web), 'app' (App Móvil), 'multiplatform' (Multiplataforma)
    project_type TEXT NOT NULL DEFAULT 'web' CHECK (project_type IN ('web', 'app', 'multiplatform')),
    -- Esquema de colores seleccionado por el usuario en el wizard
    color_scheme JSONB NOT NULL DEFAULT '{"primary":"#1890FF","secondary":"#6366F1","accent":"#10B981","background":"#0F1117"}'::jsonb,
    -- Estilo visual: 'minimal', 'glassmorphism', 'brutalist', 'neomorphism', 'corporate', 'playful'
    style TEXT NOT NULL DEFAULT 'minimal' CHECK (style IN ('minimal', 'glassmorphism', 'brutalist', 'neomorphism', 'corporate', 'playful')),
    -- Emoji o nombre de icono lucide para representar el proyecto
    icon TEXT DEFAULT '🚀',
    -- ID del chat de la IA asociado (vincula con ai_saved_chats y ai_webbuilder_projects)
    chat_id TEXT,
    -- Metadata flexible para extensiones futuras (e.g. framework, dependencias, etc.)
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_ai_projects_user_id ON public.ai_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_projects_chat_id ON public.ai_projects(chat_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.ai_projects ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.ai_projects;
CREATE POLICY "Users can insert their own projects" ON public.ai_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own projects" ON public.ai_projects;
CREATE POLICY "Users can view their own projects" ON public.ai_projects
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON public.ai_projects;
CREATE POLICY "Users can update their own projects" ON public.ai_projects
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.ai_projects;
CREATE POLICY "Users can delete their own projects" ON public.ai_projects
    FOR DELETE USING (auth.uid() = user_id);
