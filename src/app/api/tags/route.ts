import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Return all unique tags from news_articles
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("news_articles")
      .select("tags")
      .not("tags", "eq", "{}");

    if (error) throw error;

    // Flatten and deduplicate tags
    const allTags = new Set<string>();
    (data || []).forEach((row: any) => {
      if (Array.isArray(row.tags)) {
        row.tags.forEach((t: string) => allTags.add(t.toLowerCase()));
      }
    });

    const sorted = [...allTags].sort();
    return NextResponse.json({ tags: sorted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
