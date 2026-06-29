import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-helpers";
import { requireOrgMember } from "@/lib/enterprise-helpers";
import { createServiceClient } from "@/lib/supabase";
import type { OrgRole } from "@/lib/plan-limits";

const patchSchema = z.object({
  role: z.enum(["owner", "admin", "member"]).optional(),
  status: z.enum(["active", "invited", "removed"]).optional(),
});

/**
 * PATCH /api/empresas/[orgId]/members/[userId]
 * Cambia rol o estado de un miembro. Solo owner.
 * (admin puede remover members pero no cambiar roles ni tocar owners/admins)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; userId: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { orgId, userId } = await params;
  const authz = await requireOrgMember(orgId, auth.data.user.id, auth.data.user.email, ["owner", "admin"]);
  if (!authz.ok) return authz.response;

  try {
    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.role) updates.role = parsed.data.role;
    if (parsed.data.status) updates.status = parsed.data.status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    const service = createServiceClient();

    // Verificar el miembro objetivo
    const { data: target } = await service
      .from("organization_members")
      .select("role, status")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!target) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    // Un admin no puede tocar owners/admins (solo owner puede)
    if (authz.data.role === "admin" && target.role !== "member") {
      return NextResponse.json(
        { error: "Un administrador no puede modificar propietarios u otros administradores" },
        { status: 403 }
      );
    }

    // Un owner no puede bajarse su propio rol si es el único owner
    if (
      parsed.data.role &&
      parsed.data.role !== "owner" &&
      target.role === "owner" &&
      auth.data.user.id === userId
    ) {
      const { count } = await service
        .from("organization_members")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("role", "owner")
        .eq("status", "active");
      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "No puedes bajarte de propietario: debes transferir la propiedad primero" },
          { status: 400 }
        );
      }
    }

    const { data, error } = await service
      .from("organization_members")
      .update(updates)
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      console.error("[members PATCH] error:", error.message);
      return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
    }

    return NextResponse.json({ member: data });
  } catch (error: any) {
    console.error("[members PATCH] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * DELETE /api/empresas/[orgId]/members/[userId]
 * Remueve a un miembro de la org. Owner/admin.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string; userId: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { orgId, userId } = await params;
  const authz = await requireOrgMember(orgId, auth.data.user.id, auth.data.user.email, ["owner", "admin"]);
  if (!authz.ok) return authz.response;

  try {
    const service = createServiceClient();

    // No auto-eliminarse si es el único owner
    if (auth.data.user.id === userId && authz.data.role === "owner") {
      const { count } = await service
        .from("organization_members")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("role", "owner")
        .eq("status", "active");
      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "No puedes abandonar la organización siendo el único propietario" },
          { status: 400 }
        );
      }
    }

    const { error } = await service
      .from("organization_members")
      .update({ status: "removed" })
      .eq("organization_id", orgId)
      .eq("user_id", userId);

    if (error) {
      console.error("[members DELETE] error:", error.message);
      return NextResponse.json({ error: "No se pudo remover" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[members DELETE] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
