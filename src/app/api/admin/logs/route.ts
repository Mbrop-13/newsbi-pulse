import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const limitRaw = Number(req.nextUrl.searchParams.get("limit") || "80");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 80;

  const service = createServiceClient();
  const { data, error } = await service
    .from("ai_pipeline_logs")
    .select("id, trace_id, step, model, prompt, response, tokens_used, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[admin/logs]", error.message);
    return NextResponse.json({ error: "No se pudieron cargar los logs" }, { status: 500 });
  }

  return NextResponse.json({ logs: data || [] });
}
