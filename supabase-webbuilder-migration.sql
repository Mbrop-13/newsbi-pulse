-- Tabla para guardar los proyectos de WebBuilder vinculados a los chats de la IA
CREATE TABLE IF NOT EXISTS public.ai_webbuilder_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_files JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Crear un índice en chat_id para búsquedas ultra rápidas
CREATE INDEX IF NOT EXISTS idx_ai_webbuilder_projects_chat_id ON public.ai_webbuilder_projects(chat_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.ai_webbuilder_projects ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para control de acceso de usuarios
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.ai_webbuilder_projects;
CREATE POLICY "Users can insert their own projects" ON public.ai_webbuilder_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own projects" ON public.ai_webbuilder_projects;
CREATE POLICY "Users can view their own projects" ON public.ai_webbuilder_projects
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON public.ai_webbuilder_projects;
CREATE POLICY "Users can update their own projects" ON public.ai_webbuilder_projects
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.ai_webbuilder_projects;
CREATE POLICY "Users can delete their own projects" ON public.ai_webbuilder_projects
    FOR DELETE USING (auth.uid() = user_id);
