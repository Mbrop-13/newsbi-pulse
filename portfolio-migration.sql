-- Fase 3 y 4: Migración para Notificaciones y Portafolio

-- Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'price_alert', 'news', 'ai_message'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Tabla de Portafolios (Acciones guardadas por el usuario)
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    company_name VARCHAR(255),
    shares DECIMAL(10,4) DEFAULT 0, -- Opcional, para llevar la cuenta si tiene acciones
    average_price DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, symbol)
);

-- Habilitar RLS en portfolios
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own portfolio" ON public.portfolios
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into their own portfolio" ON public.portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own portfolio" ON public.portfolios
    FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own portfolio" ON public.portfolios
    FOR UPDATE USING (auth.uid() = user_id);

-- Tabla de Alertas de Precio
CREATE TABLE IF NOT EXISTS public.price_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    target_price DECIMAL(10,4) NOT NULL,
    condition VARCHAR(10) NOT NULL, -- 'above', 'below'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en price_alerts
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own price alerts" ON public.price_alerts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own price alerts" ON public.price_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own price alerts" ON public.price_alerts
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own price alerts" ON public.price_alerts
    FOR DELETE USING (auth.uid() = user_id);
