import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase";

// ── Chile-aware pipeline schedule (mirrors cron/route.ts) ──
function getChileHour(): number {
  const now = new Date();
  const chileTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Santiago' }));
  return chileTime.getHours();
}

function getMinIntervalMinutes(hour: number): number {
  if (hour >= 0 && hour < 7) return 60;
  if (hour >= 7 && hour < 9) return 15;
  if (hour >= 9 && hour < 17) return 10;
  if (hour >= 17 && hour < 21) return 20;
  return 30;
}

function getScheduleLabel(hour: number): string {
  if (hour >= 0 && hour < 7) return "Madrugada";
  if (hour >= 7 && hour < 9) return "Pre-apertura";
  if (hour >= 9 && hour < 17) return "Mercado abierto";
  if (hour >= 17 && hour < 21) return "Post-mercado";
  return "Noche";
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const sc = createServiceClient();

    const { data: adminRow } = await sc.from("admin_users").select("role").eq("user_id", user.id).single();
    if (!adminRow || adminRow.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Core article stats ──
    const { count: totalArticles } = await sc.from("news_articles").select("*", { count: "exact", head: true });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: todayArticles } = await sc
      .from("news_articles")
      .select("*", { count: "exact", head: true })
      .gte("published_at", todayStart.toISOString());

    const { count: hiddenArticles } = await sc
      .from("news_articles")
      .select("*", { count: "exact", head: true })
      .eq("is_hidden", true);

    const { count: pinnedArticles } = await sc
      .from("news_articles")
      .select("*", { count: "exact", head: true })
      .eq("is_pinned", true);

    // ── Registered users count ──
    let totalUsers = 0;
    try {
      const { count } = await sc.from("profiles").select("*", { count: "exact", head: true });
      totalUsers = count || 0;
    } catch { /* profiles table might not exist */ }

    // ── Pipeline last run ──
    let lastPipelineRun: any = null;
    try {
      const { data } = await sc
        .from("pipeline_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      lastPipelineRun = data;
    } catch { /* table might not exist */ }

    // ── Pipeline schedule info ──
    const chileHour = getChileHour();
    const intervalMinutes = getMinIntervalMinutes(chileHour);
    const scheduleLabel = getScheduleLabel(chileHour);

    let nextRunEstimate: string | null = null;
    let minutesSinceLastRun: number | null = null;
    if (lastPipelineRun?.created_at) {
      minutesSinceLastRun = Math.round((Date.now() - new Date(lastPipelineRun.created_at).getTime()) / 60000);
      const minutesUntilNext = Math.max(0, intervalMinutes - minutesSinceLastRun);
      nextRunEstimate = new Date(Date.now() + minutesUntilNext * 60000).toISOString();
    }

    // ── Today's AI token usage ──
    let tokensToday = 0;
    let aiCallsToday = 0;
    let grokCallsToday = 0;
    try {
      const { data: todayLogs } = await sc
        .from("ai_pipeline_logs")
        .select("tokens_used, model")
        .gte("created_at", todayStart.toISOString());

      if (todayLogs) {
        for (const log of todayLogs) {
          tokensToday += log.tokens_used || 0;
          aiCallsToday++;
          if (log.model?.includes("grok")) grokCallsToday++;
        }
      }
    } catch { /* table might not exist */ }

    // ── Estimated Grok cost today (input: $5/1M, output: $25/1M → ~$0.02-0.05/call) ──
    const estimatedCostToday = grokCallsToday * 0.04; // avg ~$0.04 per Grok call

    // ── Pipeline runs today ──
    let pipelineRunsToday = 0;
    let totalArticlesSavedToday = 0;
    try {
      const { data: runsToday } = await sc
        .from("pipeline_runs")
        .select("articles_published, grok_calls, duration_ms")
        .gte("created_at", todayStart.toISOString());

      if (runsToday) {
        pipelineRunsToday = runsToday.length;
        totalArticlesSavedToday = runsToday.reduce((sum, r) => sum + (r.articles_published || 0), 0);
      }
    } catch { /* table might not exist */ }

    // ── Articles per day (last 7 days) ──
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

    // ── Category breakdown ──
    const { data: categoryData } = await sc.from("news_articles").select("category");
    const categoryMap: Record<string, number> = {};
    categoryData?.forEach((a) => {
      const cat = a.category || "general";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const categories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    // ── Source breakdown (top sources) ──
    const { data: sourceData } = await sc
      .from("news_articles")
      .select("sources")
      .order("published_at", { ascending: false })
      .limit(100);

    const sourceMap: Record<string, number> = {};
    sourceData?.forEach((a) => {
      if (Array.isArray(a.sources)) {
        for (const s of a.sources) {
          const name = s.name || "Desconocido";
          sourceMap[name] = (sourceMap[name] || 0) + 1;
        }
      }
    });
    const topSources = Object.entries(sourceMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      // Core stats
      totalArticles: totalArticles || 0,
      todayArticles: todayArticles || 0,
      hiddenArticles: hiddenArticles || 0,
      pinnedArticles: pinnedArticles || 0,
      totalUsers,
      // Pipeline
      pipeline: {
        lastRun: lastPipelineRun,
        minutesSinceLastRun,
        nextRunEstimate,
        intervalMinutes,
        chileHour,
        scheduleLabel,
        runsToday: pipelineRunsToday,
        articlesSavedToday: totalArticlesSavedToday,
      },
      // AI costs
      ai: {
        tokensToday,
        aiCallsToday,
        grokCallsToday,
        estimatedCostToday: Math.round(estimatedCostToday * 100) / 100,
      },
      // Charts
      dailyCounts,
      categories,
      topSources,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
