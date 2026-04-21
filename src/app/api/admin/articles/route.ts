import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase";

// Helper: verify admin
async function verifyAdmin(): Promise<{ user: any; sc: any } | string> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) return `Not authenticated: ${authError?.message || "no session"}`;

  const sc = createServiceClient();
  const { data: adminRow, error: adminError } = await sc.from("admin_users").select("role").eq("user_id", user.id).single();
  if (!adminRow || adminRow.role !== "admin") return `Not admin: user=${user.email}, adminRow=${JSON.stringify(adminRow)}, err=${adminError?.message}`;

  return { user, sc };
}

// GET: List articles with search/filter/pagination
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin();
    if (typeof auth === "string") return NextResponse.json({ error: auth }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || ""; // all | hidden | pinned
    const offset = (page - 1) * limit;

    let query = auth.sc
      .from("news_articles")
      .select("id, title, slug, category, tags, image_url, published_at, is_hidden, is_pinned, relevance_score, sources", { count: "exact" })
      .order("published_at", { ascending: false });

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (status === "hidden") {
      query = query.eq("is_hidden", true);
    } else if (status === "pinned") {
      query = query.eq("is_pinned", true);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      articles: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create new article
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin();
    if (typeof auth === "string") return NextResponse.json({ error: auth }, { status: 403 });

    const body = await request.json();
    const { title, content, enriched_content, category, tags, image_url, relevance_score } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    // Generate slug
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80)
      + "-" + Date.now().toString(36);

    const { data, error } = await auth.sc.from("news_articles").insert({
      title,
      content,
      enriched_content: enriched_content || content,
      category: category || "general",
      tags: tags || [],
      image_url: image_url || null,
      relevance_score: relevance_score || 0.5,
      slug,
      published_at: new Date().toISOString(),
      sources: [{ name: "Reclu Editorial", url: "/" }],
      is_hidden: false,
      is_pinned: false,
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ article: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
