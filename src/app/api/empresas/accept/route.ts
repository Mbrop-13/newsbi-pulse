import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-helpers";
import { createServiceClient } from "@/lib/supabase";

const acceptSchema = z.object({ token: z.string().min(10) });

/**
 * POST /api/empresas/accept
 * Acepta una invitación. Requiere auth. El email del usuario debe coincidir con el de la invitación.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    const parsed = acceptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    const service = createServiceClient();

    const { data: invitation, error } = await service
      .from("organization_invitations")
      .select("*")
      .eq("token", parsed.data.token)
      .maybeSingle();

    if (error || !invitation) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }
    if (invitation.accepted_at) {
      return NextResponse.json({ error: "Esta invitación ya fue utilizada" }, { status: 400 });
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: "Esta invitación ha expirado" }, { status: 400 });
    }

    // Validar coincidencia de email (case-insensitive)
    if (
      auth.data.user.email &&
      auth.data.user.email.toLowerCase() !== invitation.email.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error: `Esta invitación es para ${invitation.email}. Inicia sesión con ese correo.`,
          expected_email: invitation.email,
        },
        { status: 403 }
      );
    }

    // Verificar que no esté ya como miembro activo
    const { data: existing } = await service
      .from("organization_members")
      .select("id, status")
      .eq("organization_id", invitation.organization_id)
      .eq("user_id", auth.data.user.id)
      .maybeSingle();

    if (existing?.status === "active") {
      // Marcar la invitación como aceptada igualmente
      await service
        .from("organization_invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invitation.id);
      return NextResponse.json({ ok: true, already_member: true, org_id: invitation.organization_id });
    }

    // Insertar/actualizar membresía
    if (existing) {
      await service
        .from("organization_members")
        .update({ status: "active", role: invitation.role, joined_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await service.from("organization_members").insert({
        organization_id: invitation.organization_id,
        user_id: auth.data.user.id,
        invited_email: invitation.email,
        role: invitation.role,
        status: "active",
      });
    }

    // Marcar invitación como aceptada
    await service
      .from("organization_invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);

    return NextResponse.json({ ok: true, org_id: invitation.organization_id });
  } catch (error: any) {
    console.error("[accept] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
