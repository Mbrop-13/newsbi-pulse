import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { requireOrgMember, getOrgSubscription } from "@/lib/enterprise-helpers";

/**
 * GET /api/empresas/[orgId]
 * Detalles de la organización (cualquier miembro activo).
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
    const subscription = await getOrgSubscription(orgId);

    // Contar miembros activos
    const { createServiceClient } = await import("@/lib/supabase");
    const service = createServiceClient();
    const { count } = await service
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "active");

    return NextResponse.json({
      org: authz.data.org,
      role: authz.data.role,
      subscription,
      activeMemberCount: count ?? 0,
    });
  } catch (error: any) {
    console.error("[empresas/[orgId]] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * PATCH /api/empresas/[orgId]
 * Actualiza datos de la org (solo owner/admin).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { orgId } = await params;
  const authz = await requireOrgMember(orgId, auth.data.user.id, auth.data.user.email, ["owner", "admin"]);
  if (!authz.ok) return authz.response;

  try {
    const body = await request.json().catch(() => null);
    const allowed = ["name", "rut", "billing_email", "logo_url", "allowed_domains"] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body?.[key] !== undefined) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    const { createServiceClient } = await import("@/lib/supabase");
    const service = createServiceClient();
    const { data, error } = await service
      .from("organizations")
      .update(updates)
      .eq("id", orgId)
      .select("*")
      .single();

    if (error) {
      console.error("[empresas/[orgId] PATCH] error:", error.message);
      return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
    }

    return NextResponse.json({ org: data });
  } catch (error: any) {
    console.error("[empresas/[orgId] PATCH] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
