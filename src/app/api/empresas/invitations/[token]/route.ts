import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

/**
 * GET /api/empresas/invitations/[token]
 * Valida un token de invitación (pública). Devuelve info de previsualización.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const service = createServiceClient();

    const { data: invitation, error } = await service
      .from("organization_invitations")
      .select("id, organization_id, email, role, expires_at, accepted_at")
      .eq("token", token)
      .maybeSingle();

    if (error || !invitation) {
      return NextResponse.json({ valid: false, error: "Invitación no encontrada" }, { status: 404 });
    }

    if (invitation.accepted_at) {
      return NextResponse.json({ valid: false, error: "Esta invitación ya fue utilizada" });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: "Esta invitación ha expirado" });
    }

    // Nombre de la org para previsualización
    const { data: org } = await service
      .from("organizations")
      .select("name, logo_url")
      .eq("id", invitation.organization_id)
      .maybeSingle();

    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
      },
      organization: org ?? null,
    });
  } catch (error: any) {
    console.error("[invitations GET] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
