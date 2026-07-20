-- ═══════════════════════════════════════════════
-- Maverlang — Shared chat revocation & expiry (A-2)
--
-- Antes: cualquier fila en shared_chat_links era servida públicamente por
-- /share/chat/[id] sin verificar si el dueño todavía quería compartir o si
-- el enlace había expirado. Esto añade flags de control de acceso.
--
-- Ejecutar después de shared-chat-full-migration.sql
-- Es idempotente: ADD COLUMN IF NOT EXISTS.
-- ═══════════════════════════════════════════════

-- is_active: el dueño puede revocar un enlace sin borrar la fila (auditoría).
ALTER TABLE shared_chat_links
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- expires_at: TTL opcional. NULL = no expira (backward-compatible).
ALTER TABLE shared_chat_links
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- revocar en bloque: helper para que el cliente pueda "dejar de compartir"
-- sin exponer UPDATE directo (lo hace vía RPC si quieres más adelante).

COMMENT ON COLUMN shared_chat_links.is_active IS
  'Si FALSE, el enlace es inaccesible públicamente aunque el UUID sea conocido.';
COMMENT ON COLUMN shared_chat_links.expires_at IS
  'Timestamp (UTC) opcional tras el cual el enlace deja de servirse. NULL = sin expiración.';

-- Índice para acelerar la lookup por id (ya existe por PK pero documentado).
CREATE INDEX IF NOT EXISTS idx_shared_chat_links_active
  ON shared_chat_links (id) WHERE is_active = TRUE;
