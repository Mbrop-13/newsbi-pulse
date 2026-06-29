import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { getUserOrg } from "@/lib/check-limits";

/**
 * GET /api/empresas/me
 * Devuelve la(s) membresía(s) organizacionales del usuario actual.
 * Por ahora devuelve la mejor org (getUserOrg elige la de mayor plan).
 */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const org = await getUserOrg(auth.data.user.id);
    return NextResponse.json({ org });
  } catch (error: any) {
    console.error("[empresas/me] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
