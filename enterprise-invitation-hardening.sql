-- ═══════════════════════════════════════════════
-- Maverlang — Hardening de invitaciones enterprise (NEW-1)
--
-- Problema: la política `invitations_select_by_token ... USING (token IS NOT NULL)`
-- exponía TODAS las filas de organization_invitations a cualquier cliente (incluido
-- anónimo), revelando email, role, organization_id y el propio token de invitación
-- a quien supiera que la tabla existe. Aunque el token sea UUID, fuga metadatos
-- de los equipos (quién invitó a quién, tamaño de cada org).
--
-- Solución:
--   1. DROP de la política pública.
--   2. RPC SECURITY DEFINER `lookup_invitation_by_token(p_token)` que devuelve
--      SÓLO los campos necesarios para previsualizar (email, role, expires_at,
--      nombre de la org) cuando el token es válido y no expirado.
--   3. Políticas RLS que sólo permiten a admins de la org ver sus invitaciones.
--
-- Ejecutar después de supabase-enterprise-migration.sql
-- ═══════════════════════════════════════════════

-- 1. Eliminar la política pública peligrosa
DROP POLICY IF EXISTS "invitations_select_by_token" ON organization_invitations;

-- 2. RPC para lookup público por token (sólo datos seguros)
CREATE OR REPLACE FUNCTION lookup_invitation_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  organization_id UUID,
  organization_name TEXT,
  status TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_token IS NULL OR length(p_token) < 32 THEN
    RETURN; -- token inválido: no devolvemos nada
  END IF;
  RETURN QUERY
  SELECT
    i.id,
    i.email,
    i.role,
    i.organization_id,
    o.name AS organization_name,
    i.status,
    i.expires_at
  FROM organization_invitations i
  JOIN organizations o ON o.id = i.organization_id
  WHERE i.token = p_token
    AND i.status = 'pending'
    AND (i.expires_at IS NULL OR i.expires_at > NOW())
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION lookup_invitation_by_token(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION lookup_invitation_by_token(TEXT) TO anon, authenticated;

-- 3. Las invitaciones ahora sólo son visibles para admins de la org.
--    (la previsualización pública se hace vía RPC, no vía SELECT directo)
DROP POLICY IF EXISTS "org_admins_read_invitations" ON organization_invitations;
CREATE POLICY "org_admins_read_invitations"
  ON organization_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.organization_id = organization_invitations.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
  );

-- INSERT/UPDATE quedan restringidos a service_role (que bypassa RLS) y a
-- admins vía policies existentes si las hubiera. Si no existían, crear:
DROP POLICY IF EXISTS "org_admins_manage_invitations" ON organization_invitations;
CREATE POLICY "org_admins_manage_invitations"
  ON organization_invitations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.organization_id = organization_invitations.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.organization_id = organization_invitations.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
  );

COMMENT ON FUNCTION lookup_invitation_by_token(TEXT) IS
  'Lookup público de invitación por token. Devuelve sólo metadatos seguros para previsualización.';
