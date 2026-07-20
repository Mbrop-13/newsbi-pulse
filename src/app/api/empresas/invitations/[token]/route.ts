import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

/**
 * GET /api/empresas/invitations/[token]
 * Valida un token de invitación (pública). Devuelve info de previsualización.
 *
 * NEW-1: usa la RPC `lookup_invitation_by_token` (SECURITY DEFINER) en lugar
 * de un SELECT directo a la tabla. Esto permite que la RLS de
 * organization_invitations sea estricta (sólo admins de la org pueden SELECT
 * directo) sin romper la previsualización pública por token.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    // Validación básica del formato del token antes de ir a BD
    if (!token || token.length < 32 || token.length > 128) {
      return NextResponse.json({ valid: false, error: "Invitación no encontrada" }, { status: 404 });
    }

    // Cliente anónimo es suficiente: la RPC está GRANTada a anon/authenticated
    // y filtra por token + status=pending + no expirada internamente.
    const supabase = createClient();

    const { data, error } = await supabase.rpc("lookup_invitation_by_token", {
      p_token: token,
    });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ valid: false, error: "Invitación no encontrada o expirada" }, { status: 404 });
    }

    const invitation = Array.isArray(data) ? data[0] : data;

    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
      },
      organization: {
        name: invitation.organization_name,
        logo_url: null,
      },
    });
  } catch (error: any) {
    console.error("[invitations GET] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
