import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const sc = createServiceClient();

    // Verify admin
    const { data: adminRow } = await sc.from("admin_users").select("role").eq("user_id", user.id).single();
    if (!adminRow || adminRow.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Total articles
    const { count: totalArticles } = await sc.from("news_articles").select("*", { count: "exact", head: true });

    // Articles today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: todayArticles } = await sc
      .from("news_articles")
      .select("*", { count: "exact", head: true })
      .gte("published_at", todayStart.toISOString());

    // Hidden articles
    const { count: hiddenArticles } = await sc
      .from("news_articles")
      .select("*", { count: "exact", head: true })
      .eq("is_hidden", true);

    // Pinned articles
    const { count: pinnedArticles } = await sc
      .from("news_articles")
      .select("*", { count: "exact", head: true })
      .eq("is_pinned", true);

    // Articles per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: recentArticles } = await sc
      .from("news_articles")
      .select("published_at")
      .gte("published_at", sevenDaysAgo.toISOString())
      .order("published_at", { ascending: true });

    const dailyCounts: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyCounts[d.toISOString().split("T")[0]] = 0;
    }
    recentArticles?.forEach((a) => {
      const day = new Date(a.published_at).toISOString().split("T")[0];
      if (dailyCounts[day] !== undefined) dailyCounts[day]++;
    });

    // Category breakdown
    const { data: categoryData } = await sc
      .from("news_articles")
      .select("category");
    const categoryMap: Record<string, number> = {};
    categoryData?.forEach((a) => {
      const cat = a.category || "general";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const categories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      totalArticles: totalArticles || 0,
      todayArticles: todayArticles || 0,
      hiddenArticles: hiddenArticles || 0,
      pinnedArticles: pinnedArticles || 0,
      dailyCounts,
      categories,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
