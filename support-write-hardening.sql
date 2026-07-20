-- ═══════════════════════════════════════════════
-- Maverlang — Hardening de writes de cliente (A-7 / M-12)
--
-- Problema: el cliente (navegador) escribe directamente en support_tickets,
-- support_messages, notifications, ai_saved_chats enviando flags sensibles
-- como `is_admin`. Si RLS no valida el rol, cualquier usuario autenticado
-- puede forjar mensajes de soporte como admin (phishing social interno).
--
-- Solución: políticas RLS con WITH CHECK que FUERCEN el valor correcto de
-- las columnas privilegiadas, ignorando lo que mande el cliente.
--
-- Idempotente: DROP POLICY IF EXISTS antes de CREATE.
-- ═══════════════════════════════════════════════

-- ─── support_messages: usuarios sólo pueden escribir como is_admin=FALSE ───
-- Los admins legítimos usan service_role (que bypassa RLS) o un RPC dedicado.
DROP POLICY IF EXISTS "users_insert_own_support_messages_non_admin" ON support_messages;
CREATE POLICY "users_insert_own_support_messages_non_admin"
  ON support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND is_admin = FALSE  -- ← fuerza: ningún cliente puede auto-elevarse a admin
  );

-- UPDATE: sólo el dueño puede tocar sus propios mensajes; nunca el flag is_admin.
DROP POLICY IF EXISTS "users_update_own_support_messages" ON support_messages;
CREATE POLICY "users_update_own_support_messages"
  ON support_messages FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND is_admin = FALSE);

-- ─── support_tickets: el dueño puede abrir/cerrar su ticket, no cambiar columnas ajenas ───
DROP POLICY IF EXISTS "users_insert_own_support_tickets" ON support_tickets;
CREATE POLICY "users_insert_own_support_tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_support_tickets" ON support_tickets;
CREATE POLICY "users_update_own_support_tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── notifications: el usuario puede marcar como leída, no crear/forzar type ───
-- Evita que el cliente fabrique notificaciones falsas (ej. "pago confirmado").
DROP POLICY IF EXISTS "users_insert_own_notifications_restricted" ON notifications;
CREATE POLICY "users_insert_own_notifications_restricted"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    -- Restringir tipos que el cliente puede crear (los críticos son server-only):
    AND type IN ('portfolio_pnl', 'price_alert', 'system_info')
  );

DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
CREATE POLICY "users_update_own_notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── ai_saved_chats: el dueño puede escribir/actualizar, scoped a su user_id ───
-- Nota: is_web_builder es metadata; se permite pero el contenido pasa por
-- sanitización en el servidor cuando se renderiza (A-8 ya arreglado).
DROP POLICY IF EXISTS "users_manage_own_ai_saved_chats" ON ai_saved_chats;
CREATE POLICY "users_manage_own_ai_saved_chats"
  ON ai_saved_chats FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── predictions: cerrar el leak público (A-3) ───
-- Antes: USING(true) exponía TODAS las predicciones a cualquier cliente.
DROP POLICY IF EXISTS "Anyone can read predictions" ON predictions;
DROP POLICY IF EXISTS "predictions_public_read" ON predictions;
CREATE POLICY "users_read_own_predictions"
  ON predictions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Comentario para auditar que estos checks están FORZADOS en BD.
COMMENT ON POLICY "users_insert_own_support_messages_non_admin" ON support_messages IS
  'Fuerza is_admin=FALSE en escrituras de cliente. Los admins escriben vía service_role.';
