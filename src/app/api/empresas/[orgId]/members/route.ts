import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { requireOrgMember } from "@/lib/enterprise-helpers";

/**
 * GET /api/empresas/[orgId]/members
 * Lista miembros activos + invitados pendientes de la org.
 * Hace join con auth.users para nombre/email/avatar.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { orgId } = await params;
  const authz = await requireOrgMember(orgId, auth.data.user.id, auth.data.user.email);
  if (!authz.ok) return authz.response;

  try {
    const { createServiceClient } = await import("@/lib/supabase");
    const service = createServiceClient();

    // Miembros (activos + invitados + removidos)
    const { data: members, error: mErr } = await service
      .from("organization_members")
      .select("*")
      .eq("organization_id", orgId)
      .order("joined_at", { ascending: true });

    if (mErr) {
      console.error("[members GET] error:", mErr.message);
      return NextResponse.json({ error: "Error al obtener miembros" }, { status: 500 });
    }

    // Enriquecer con datos de auth.users vía admin API
    const userIds = (members ?? [])
      .map((m) => m.user_id)
      .filter(Boolean) as string[];

    let userMap: Record<string, { name?: string; email?: string; avatar_url?: string }> = {};
    if (userIds.length > 0) {
      try {
        const { data: usersData } = await service.auth.admin.listUsers({
          perPage: 1000,
        });
        for (const u of usersData?.users ?? []) {
          if (userIds.includes(u.id)) {
            userMap[u.id] = {
              name: (u.user_metadata?.full_name as string) || undefined,
              email: u.email || undefined,
              avatar_url: (u.user_metadata?.avatar_url as string) || undefined,
            };
          }
        }
      } catch (e) {
        console.warn("[members GET] no se pudo enriquecer auth.users:", e);
      }
    }

    const enriched = (members ?? []).map((m) => ({
      ...m,
      ...(m.user_id ? userMap[m.user_id] : {}),
    }));

    // Invitaciones pendientes
    const { data: invitations } = await service
      .from("organization_invitations")
      .select("*")
      .eq("organization_id", orgId)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });

    return NextResponse.json({ members: enriched, invitations: invitations ?? [] });
  } catch (error: any) {
    console.error("[members GET] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
