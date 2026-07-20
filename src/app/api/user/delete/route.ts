import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * Borrado de cuenta con re-autenticación (M-8, ASVS V2.1 / NIST 800-63B).
 *
 * Acción irreversible: una cookie de sesión robada (XSS, robo de dispositivo)
 * NO debe ser suficiente para eliminar la cuenta permanentemente. Exigimos
 * re-confirmación de la contraseña actual o, si el usuario usa exclusivamente
 * OAuth sin password, un token de confirmación fresco que el servidor envía
 * por email y que debe incluirse en esta misma llamada (flujo de dos pasos).
 */

const deleteSchema = z.object({
  // Uno de los dos obligatorio:
  currentPassword: z.string().min(1).max(256).optional(),
  confirmToken: z.string().min(8).max(256).optional(),
}).refine(
  (d) => d.currentPassword || d.confirmToken,
  { message: "Se requiere currentPassword o confirmToken" }
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // ── Validación del body ──
    const body = await req.json().catch(() => null);
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Confirmación requerida para borrar la cuenta", details: parsed.error.format() },
        { status: 400 }
      );
    }
    const { currentPassword, confirmToken } = parsed.data;

    // ── Re-autenticación (uno de los dos caminos) ──
    if (currentPassword) {
      // Verificar password re-firmándolo contra Supabase Auth
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });
      if (signInError) {
        return NextResponse.json(
          { error: "Contraseña incorrecta. No se puede eliminar la cuenta." },
          { status: 403 }
        );
      }
    } else if (confirmToken) {
      // Flujo de token por email (para usuarios OAuth-only sin password).
      // El token es un HMAC corto almacenado en user_preferences con expiración.
      // Se solicita en un endpoint previo /api/user/delete/request-token.
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data: prefRow } = await supabaseAdmin
        .from("user_preferences")
        .select("delete_confirm_token, delete_token_expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      const expectedToken = prefRow?.delete_confirm_token;
      const expiresAt = prefRow?.delete_token_expires_at;
      if (!expectedToken || !expiresAt) {
        return NextResponse.json({ error: "Token no solicitado o expirado" }, { status: 403 });
      }
      if (new Date(expiresAt).getTime() < Date.now()) {
        return NextResponse.json({ error: "Token expirado" }, { status: 403 });
      }
      // Constant-time compare
      const a = Buffer.from(String(confirmToken));
      const b = Buffer.from(String(expectedToken));
      if (a.length !== b.length || !safeEqual(a, b)) {
        return NextResponse.json({ error: "Token inválido" }, { status: 403 });
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[Delete Profile API] Error: Supabase credentials missing");
      return NextResponse.json({ error: "Error de configuración en el servidor" }, { status: 500 });
    }

    // Initialize admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Delete the user from auth.users (which cascades to other tables)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("[Delete Profile API] Error deleting user:", error);
      return NextResponse.json({ error: "No se pudo eliminar la cuenta." }, { status: 500 });
    }

    // Clear session cookies
    await supabase.auth.signOut();

    return NextResponse.json({ success: true, message: "Perfil eliminado con éxito" });
  } catch (err: any) {
    console.error("[Delete Profile API] Exception:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  const { timingSafeEqual } = require("crypto");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
