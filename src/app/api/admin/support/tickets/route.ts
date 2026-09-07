import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const service = createServiceClient();
  const { data, error } = await service
    .from("support_tickets")
    .select("id, user_id, subject, status, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[admin/support/tickets]", error.message);
    return NextResponse.json({ error: "No se pudieron cargar los tickets" }, { status: 500 });
  }

  return NextResponse.json({ tickets: data || [] });
}
