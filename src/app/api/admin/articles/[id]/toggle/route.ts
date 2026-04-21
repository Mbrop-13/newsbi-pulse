import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const sc = createServiceClient();
  const { data: adminRow } = await sc.from("admin_users").select("role").eq("user_id", user.id).single();
  if (!adminRow || adminRow.role !== "admin") return null;
  return { user, sc };
}

// PATCH: Quick toggle is_hidden or is_pinned
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { field } = body; // "is_hidden" | "is_pinned"

    if (!["is_hidden", "is_pinned"].includes(field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    // Get current value
    const { data: article } = await auth.sc
      .from("news_articles")
      .select(field)
      .eq("id", id)
      .single();

    if (!article) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const newValue = !(article as any)[field];

    const { data, error } = await auth.sc
      .from("news_articles")
      .update({ [field]: newValue, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, is_hidden, is_pinned")
      .single();

    if (error) throw error;

    return NextResponse.json({ article: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
