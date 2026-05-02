-- Tabla para historiales de chat en la nube (Sincronización multi-dispositivo)
CREATE TABLE IF NOT EXISTS public.ai_saved_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_id TEXT NOT NULL,
    title TEXT NOT NULL,
    messages JSONB DEFAULT '[]'::jsonb,
    attached_articles JSONB DEFAULT '[]'::jsonb,
    attached_files JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Políticas RLS (Row Level Security)
ALTER TABLE public.ai_saved_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own chats" ON public.ai_saved_chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own chats" ON public.ai_saved_chats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats" ON public.ai_saved_chats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats" ON public.ai_saved_chats
    FOR DELETE USING (auth.uid() = user_id);
