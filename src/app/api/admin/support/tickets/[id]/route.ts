import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["open", "closed", "pending", "in_progress", "waiting"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id || id.length > 80) {
    return NextResponse.json({ error: "Ticket inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("support_tickets")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, status, updated_at")
    .maybeSingle();

  if (error) {
    console.error("[admin/support/ticket patch]", error.message);
    return NextResponse.json({ error: "No se pudo actualizar el ticket" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ticket: data });
}
