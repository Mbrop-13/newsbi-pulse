import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase";

function generateSlug(text: string) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .substring(0, 50)
    .replace(/-$/, "");
}

async function verifyAdmin(): Promise<{ user: any; sc: any } | string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "Not authenticated";
  const sc = createServiceClient();
  const { data: adminRow } = await sc.from("admin_users").select("role").eq("user_id", user.id).single();
  if (!adminRow || adminRow.role !== "admin") return "Forbidden";
  return { user, sc };
}

// GET: List all predictions (admin)
export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (typeof auth === "string") return NextResponse.json({ error: auth }, { status: 403 });

    const { data, error } = await auth.sc
      .from("predictions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const predictions = (data || []).map((p: any) => ({
      ...p,
      prob_a: p.pool_a / (p.pool_a + p.pool_b),
      prob_b: p.pool_b / (p.pool_a + p.pool_b),
    }));

    return NextResponse.json({ predictions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create new prediction market
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin();
    if (typeof auth === "string") return NextResponse.json({ error: auth }, { status: 403 });

    const body = await request.json();
    const {
      title, description, rules, resolution_method, category,
      tags, image_url, option_a_label, option_b_label,
      initial_liquidity, resolution_date,
    } = body;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const liquidity = initial_liquidity || 300;
    const baseSlug = generateSlug(title);
    const finalSlug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;

    const { data, error } = await auth.sc.from("predictions").insert({
      title,
      slug: finalSlug,
      description: description || null,
      rules: rules || null,
      resolution_method: resolution_method || null,
      category: category || "politics",
      tags: tags || [],
      image_url: image_url || null,
      option_a_label: option_a_label || "Sí",
      option_b_label: option_b_label || "No",
      pool_a: liquidity,
      pool_b: liquidity,
      initial_liquidity: liquidity,
      resolution_date: resolution_date || null,
      status: "active",
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ prediction: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
