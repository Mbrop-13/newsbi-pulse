-- ============================================================================
-- Maverlang — Enterprise / Multi-tenant Migration
-- ----------------------------------------------------------------------------
-- Crea las tablas necesarias para Planes de Empresa (B2B, modelo por asiento):
--   organizations          → tenant raíz (la empresa)
--   organization_members   → quién pertenece a qué org y con qué rol
--   organization_invitations → invitaciones pendientes con magic link
--   organization_subscriptions → espejo de subscriptions a nivel organización
--   enterprise_leads       → leads del formulario de contacto ventas
--
-- Ejecutar manualmente en Supabase SQL Editor.
-- ============================================================================

-- 1. Organizations (tenant raíz) ----------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  rut TEXT,
  billing_email TEXT,
  plan TEXT NOT NULL DEFAULT 'team',      -- team | business | enterprise
  seat_count INT NOT NULL DEFAULT 3,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- monthly | annual
  status TEXT NOT NULL DEFAULT 'trial',   -- trial | active | past_due | canceled
  current_period_end TIMESTAMPTZ,
  logo_url TEXT,
  allowed_domains TEXT[],                 -- dominios auto-join (ej: {miempresa.cl})
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Organization members -----------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT,
  role TEXT NOT NULL DEFAULT 'member',    -- owner | admin | member
  status TEXT NOT NULL DEFAULT 'active',  -- active | invited | removed
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id),
  UNIQUE(organization_id, invited_email)
);

-- 3. Invitations --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Organization subscriptions (espejo de subscriptions individual) -----------
CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,                     -- team | business | enterprise
  seats INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'trial',   -- trial | active | past_due | canceled
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  payment_provider TEXT NOT NULL DEFAULT 'mercadopago',
  external_subscription_id TEXT,
  external_payer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Enterprise leads (formulario de contacto ventas) -------------------------
CREATE TABLE IF NOT EXISTS enterprise_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  rut TEXT,
  team_size TEXT,                         -- '1-5' | '6-20' | '21-100' | '100+'
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',     -- new | contacted | won | lost
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON organization_members(status);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_org_subs_org ON organization_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_leads_status ON enterprise_leads(status);
CREATE INDEX IF NOT EXISTS idx_orgs_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_orgs_status ON organizations(status);

-- Updated_at trigger (reutilizable para todas las tablas) ---------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orgs_updated ON organizations;
CREATE TRIGGER trg_orgs_updated BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_org_members_updated ON organization_members;
CREATE TRIGGER trg_org_members_updated BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_org_subs_updated ON organization_subscriptions;
CREATE TRIGGER trg_org_subs_updated BEFORE UPDATE ON organization_subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_leads ENABLE ROW LEVEL SECURITY;

-- organizations: miembros activos pueden leer su org -------------------------
DROP POLICY IF EXISTS "org_select_members" ON organizations;
CREATE POLICY "org_select_members" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.organization_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- owner + admin pueden actualizar
DROP POLICY IF EXISTS "org_update_admins" ON organizations;
CREATE POLICY "org_update_admins" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.organization_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
  );

-- El creador puede insertar su org (validación adicional a nivel API)
DROP POLICY IF EXISTS "org_insert_creator" ON organizations;
CREATE POLICY "org_insert_creator" ON organizations
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- organization_members: miembros activos de la org pueden listar -------------
DROP POLICY IF EXISTS "members_select_org" ON organization_members;
CREATE POLICY "members_select_org" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT m2.organization_id FROM organization_members m2
      WHERE m2.user_id = auth.uid() AND m2.status = 'active'
    )
    OR user_id = auth.uid()
  );

-- owner/admin pueden invitar (insert) y modificar roles
DROP POLICY IF EXISTS "members_insert_admins" ON organization_members;
CREATE POLICY "members_insert_admins" ON organization_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.organization_id = organization_members.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "members_update_admins" ON organization_members;
CREATE POLICY "members_update_admins" ON organization_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.organization_id = organization_members.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
  );

-- Un usuario puede auto-insertarse al aceptar invitación (vía API con service role)
DROP POLICY IF EXISTS "members_insert_self_accept" ON organization_members;
CREATE POLICY "members_insert_self_accept" ON organization_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- organization_invitations: owner/admin de la org pueden gestionar ------------
DROP POLICY IF EXISTS "invitations_select_admins" ON organization_invitations;
CREATE POLICY "invitations_select_admins" ON organization_invitations
  FOR SELECT USING (
    organization_id IN (
      SELECT m.organization_id FROM organization_members m
      WHERE m.user_id = auth.uid() AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "invitations_insert_admins" ON organization_invitations;
CREATE POLICY "invitations_insert_admins" ON organization_invitations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT m.organization_id FROM organization_members m
      WHERE m.user_id = auth.uid() AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "invitations_update_admins" ON organization_invitations;
CREATE POLICY "invitations_update_admins" ON organization_invitations
  FOR UPDATE USING (
    organization_id IN (
      SELECT m.organization_id FROM organization_members m
      WHERE m.user_id = auth.uid() AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
  );

-- Vista pública para validar token de invitación (lectura por token)
DROP POLICY IF EXISTS "invitations_select_by_token" ON organization_invitations;
CREATE POLICY "invitations_select_by_token" ON organization_invitations
  FOR SELECT USING (token IS NOT NULL);

-- organization_subscriptions: miembros activos pueden leer -------------------
DROP POLICY IF EXISTS "org_subs_select_members" ON organization_subscriptions;
CREATE POLICY "org_subs_select_members" ON organization_subscriptions
  FOR SELECT USING (
    organization_id IN (
      SELECT m.organization_id FROM organization_members m
      WHERE m.user_id = auth.uid() AND m.status = 'active'
    )
  );

-- enterprise_leads: inserción pública (formulario sin login) + lectura admin --
DROP POLICY IF EXISTS "leads_public_insert" ON enterprise_leads;
CREATE POLICY "leads_public_insert" ON enterprise_leads
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- Fin de la migración
-- ============================================================================
