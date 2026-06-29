import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-helpers";
import { requireOrgMember, generateInvitationToken } from "@/lib/enterprise-helpers";
import { createServiceClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email/azure-client";
import { teamInvitationEmail } from "@/lib/email/enterprise-templates";
import type { OrgRole } from "@/lib/plan-limits";

const inviteSchema = z.object({
  email: z.string().email().toLowerCase(),
  role: z.enum(["admin", "member"]).default("member"),
});

/**
 * POST /api/empresas/[orgId]/invite
 * Crea una invitación y envía email con magic link. Owner/admin.
 */
export async function POST(
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
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.format() }, { status: 400 });
    }

    const { email, role } = parsed.data;
    const service = createServiceClient();

    // Verificar que no exista ya como miembro activo o invitado pendiente
    const { data: existingMember } = await service
      .from("organization_members")
      .select("id, status")
      .eq("organization_id", orgId)
      .or(`user_id.eq.${auth.data.user.id},invited_email.eq.${email}`)
      .maybeSingle();

    if (existingMember?.status === "active") {
      // verificar email real del usuario vía invited_email
      const { data: byEmail } = await service
        .from("organization_members")
        .select("id, status")
        .eq("organization_id", orgId)
        .eq("invited_email", email)
        .maybeSingle();
      if (byEmail?.status === "active") {
        return NextResponse.json({ error: "Ya es miembro de la organización" }, { status: 400 });
      }
    }

    const { data: existingInv } = await service
      .from("organization_invitations")
      .select("id")
      .eq("organization_id", orgId)
      .eq("email", email)
      .is("accepted_at", null)
      .maybeSingle();

    if (existingInv) {
      return NextResponse.json({ error: "Ya existe una invitación pendiente para este email" }, { status: 400 });
    }

    // Comprobar asientos disponibles
    const org = authz.data.org;
    const { count } = await service
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "active");

    const { count: pendingInvites } = await service
      .from("organization_invitations")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .is("accepted_at", null);

    const usedSeats = (count ?? 0) + (pendingInvites ?? 0);
    if (usedSeats >= org.seat_count) {
      return NextResponse.json(
        { error: `Límite de asientos alcanzado (${org.seat_count}). Aumenta los asientos para invitar más.` },
        { status: 400 }
      );
    }

    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invitation, error: invErr } = await service
      .from("organization_invitations")
      .insert({
        organization_id: orgId,
        email,
        role: role as OrgRole,
        token,
        invited_by: auth.data.user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select("*")
      .single();

    if (invErr || !invitation) {
      console.error("[invite] error:", invErr?.message);
      return NextResponse.json({ error: "No se pudo crear la invitación" }, { status: 500 });
    }

    // Enviar email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://maverlang.cl";
    const acceptUrl = `${siteUrl}/invitar/${token}`;
    const inviterName = authz.data.org.name; // fallback al nombre de la org

    try {
      const { subject, html } = teamInvitationEmail({
        inviteeEmail: email,
        orgName: org.name,
        inviterName: inviterName,
        role: role as OrgRole,
        acceptUrl,
      });
      await sendEmail({ to: email, subject, html });
    } catch (emailErr) {
      console.warn("[invite] no se pudo enviar email:", emailErr);
    }

    return NextResponse.json({ ok: true, invitation, acceptUrl });
  } catch (error: any) {
    console.error("[invite] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * DELETE /api/empresas/[orgId]/invite
 * Revoca una invitación pendiente (por email o token en query). Owner/admin.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { orgId } = await params;
  const authz = await requireOrgMember(orgId, auth.data.user.id, auth.data.user.email, ["owner", "admin"]);
  if (!authz.ok) return authz.response;

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const service = createServiceClient();
    let query = service
      .from("organization_invitations")
      .delete()
      .eq("organization_id", orgId)
      .is("accepted_at", null);

    if (token) query = query.eq("token", token);
    else if (email) query = query.eq("email", email);
    else return NextResponse.json({ error: "Se requiere token o email" }, { status: 400 });

    const { error } = await query;
    if (error) {
      console.error("[invite DELETE] error:", error.message);
      return NextResponse.json({ error: "No se pudo revocar" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[invite DELETE] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
