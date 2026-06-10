-- ================================================
-- Supabase Migration for Google Drive Integration
-- Run this in Supabase SQL Editor (Dashboard → SQL)
-- ================================================

CREATE TABLE IF NOT EXISTS public.user_drive_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_drive_connections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own connection" ON public.user_drive_connections
    FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION handle_drive_conn_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_drive_connections_updated_at
    BEFORE UPDATE ON public.user_drive_connections
    FOR EACH ROW
    EXECUTE FUNCTION handle_drive_conn_updated_at();
