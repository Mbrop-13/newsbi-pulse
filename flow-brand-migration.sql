-- =============================================================================
-- Migración: Flow Marca (brand kit + items analizados)
-- Subsección "Marca" dentro de Flow — 1 marca activa por usuario
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.flow_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Mi marca',
    brand_type TEXT NOT NULL DEFAULT 'other'
        CHECK (brand_type IN ('informative', 'online_store', 'service', 'saas', 'local_business', 'other')),
    description TEXT DEFAULT '',
    logo_data TEXT,
    website_url TEXT,
    default_logo_mode TEXT NOT NULL DEFAULT 'ai_decide'
        CHECK (default_logo_mode IN ('none', 'bottom_right', 'top_right', 'bottom_left', 'ai_decide')),
    ai_profile JSONB DEFAULT '{}'::jsonb,
    analysis_status TEXT NOT NULL DEFAULT 'idle'
        CHECK (analysis_status IN ('idle', 'analyzing', 'completed', 'failed')),
    analysis_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_flow_brands_user_id ON public.flow_brands(user_id);

CREATE TABLE IF NOT EXISTS public.flow_brand_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.flow_brands(id) ON DELETE CASCADE,
    kind TEXT NOT NULL DEFAULT 'page'
        CHECK (kind IN ('home', 'catalog', 'product', 'page')),
    name TEXT NOT NULL,
    url TEXT,
    description TEXT DEFAULT '',
    image_url TEXT,
    analysis_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (analysis_status IN ('pending', 'running', 'done', 'failed', 'skipped')),
    analysis JSONB DEFAULT '{}'::jsonb,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_flow_brand_items_brand_id ON public.flow_brand_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_flow_brand_items_kind ON public.flow_brand_items(brand_id, kind);

-- Row Level Security
ALTER TABLE public.flow_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_brand_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own brand" ON public.flow_brands;
CREATE POLICY "Users can view own brand" ON public.flow_brands
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own brand" ON public.flow_brands;
CREATE POLICY "Users can insert own brand" ON public.flow_brands
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own brand" ON public.flow_brands;
CREATE POLICY "Users can update own brand" ON public.flow_brands
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own brand" ON public.flow_brands;
CREATE POLICY "Users can delete own brand" ON public.flow_brands
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own brand items" ON public.flow_brand_items;
CREATE POLICY "Users can view own brand items" ON public.flow_brand_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.flow_brands b
            WHERE b.id = brand_id AND b.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own brand items" ON public.flow_brand_items;
CREATE POLICY "Users can insert own brand items" ON public.flow_brand_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.flow_brands b
            WHERE b.id = brand_id AND b.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own brand items" ON public.flow_brand_items;
CREATE POLICY "Users can update own brand items" ON public.flow_brand_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.flow_brands b
            WHERE b.id = brand_id AND b.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own brand items" ON public.flow_brand_items;
CREATE POLICY "Users can delete own brand items" ON public.flow_brand_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.flow_brands b
            WHERE b.id = brand_id AND b.user_id = auth.uid()
        )
    );
