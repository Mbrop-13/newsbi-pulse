import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse, GENERAL_API_LIMIT } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`tags:${ip}`, {
      ...GENERAL_API_LIMIT,
      failClosedInProd: true,
    });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("news_articles")
      .select("tags")
      .not("tags", "eq", "{}")
      .limit(200);

    if (error) {
      console.error("[tags]", error.message);
      return NextResponse.json({ error: "No se pudieron cargar los tags" }, { status: 500 });
    }

    const allTags = new Set<string>();
    for (const row of data || []) {
      if (!Array.isArray(row.tags)) continue;
      for (const t of row.tags) {
        if (typeof t === "string" && t.trim()) allTags.add(t.toLowerCase());
        if (allTags.size >= 400) break;
      }
      if (allTags.size >= 400) break;
    }

    return NextResponse.json({ tags: [...allTags].sort() });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
