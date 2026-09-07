import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const messageSchema = z.object({
  message: z.string().trim().min(1).max(4000),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id || id.length > 80) {
    return NextResponse.json({ error: "Ticket inválido" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("support_messages")
    .select("id, ticket_id, user_id, is_admin, message, created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    console.error("[admin/support/messages]", error.message);
    return NextResponse.json({ error: "No se pudieron cargar los mensajes" }, { status: 500 });
  }

  return NextResponse.json({ messages: data || [] });
}

export async function POST(
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
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: ticket } = await service
    .from("support_tickets")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
  }
  if (ticket.status === "closed") {
    return NextResponse.json({ error: "El ticket está cerrado" }, { status: 409 });
  }

  const { data, error } = await service
    .from("support_messages")
    .insert({
      ticket_id: id,
      user_id: auth.data.user.id,
      is_admin: true,
      message: parsed.data.message,
    })
    .select("id, ticket_id, user_id, is_admin, message, created_at")
    .single();

  if (error) {
    console.error("[admin/support/messages post]", error.message);
    return NextResponse.json({ error: "No se pudo enviar el mensaje" }, { status: 500 });
  }

  await service
    .from("support_tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ message: data });
}
