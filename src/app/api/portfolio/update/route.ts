import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { z } from "zod";

/**
 * Mutaciones de portfolio validadas server-side (A-6).
 *
 * ANTES: el cliente escribía `shares` y `average_price` directamente vía el
 * cliente anon de Supabase sin validación de rango ni verificación de
 * ownership más allá del RLS implícito.
 *
 * AHORA: esta ruta valida con zod (rangos numéricos saneados), exige sesión,
 * y usa el cliente SSR (que respeta RLS con el user_id del JWT).
 */

const MAX_POSITIONS = 1000; // techo razonable por usuario

const updateSchema = z.object({
  assetId: z.string().uuid("assetId debe ser un UUID válido"),
  field: z.enum(["shares", "average_price"], "campo no modificable"),
  value: z
    .number()
    .finite()
    .min(0, "el valor no puede ser negativo")
    .max(1_000_000_000, "valor fuera de rango"), // techo ~1B USD/acciones
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { assetId, field, value } = parsed.data;

    // UPDATE con cláusula de ownership explícita (defensa en profundidad: si
    // el RLS fallara o se desactivara, el filtro user_id sigue acotando).
    const { data, error } = await auth.data.supabase
      .from("portfolios")
      .update({ [field]: value })
      .eq("id", assetId)
      .eq("user_id", auth.data.user.id) // ← ownership forzado server-side
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[portfolio/update] DB error:", error);
      return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }

    if (!data) {
      // El asset no existe o no pertenece al usuario
      return NextResponse.json(
        { error: "Activo no encontrado o sin permisos" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[portfolio/update] Unexpected:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// Export simbólico para evitar tree-shake del techo de posiciones (doc).
export const _MAX_POSITIONS = MAX_POSITIONS;
