import { NextRequest, NextResponse } from "next/server";
import { runNewsPipeline } from "@/lib/services/news-pipeline";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Grok sequential processing needs more time

// ── Cron Job Handler ─────────────────────────────
// Called by Vercel Cron every 5 minutes or manually via button
// Pipeline: Fetch (NewsData.io) → Deduplicate (Hunter Alpha) → Enrich (Grok 4.1) → Store (Supabase)

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for automated calls
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Allow manual triggers for development/testing if a query param is passed
    const isManual = request.nextUrl.searchParams.get("manual") === "true";
    console.log(`[CRON] Manual Trigger: ${isManual}`);

    if (!isManual && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[CRON] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CRON] Executing News Pipeline...");
    
    // Run the massive 3-phase AI aggregation pipeline
    const result = await runNewsPipeline();
    console.log("[CRON] Pipeline Result:", JSON.stringify(result, null, 2));

    if (!result.success) {
      console.error(`[CRON] Pipeline failed at step: ${result.step}. Error: ${result.error}`);
      return NextResponse.json({
        success: false,
        error: result.error,
        step: result.step
      }, { status: 500 });
    }

    console.log(`[CRON] Success! Added ${result.articles.length} articles.`);

    return NextResponse.json({
      success: true,
      message: `Processed and saved ${result.articles.length} articles via AI Pipeline`,
      timestamp: new Date().toISOString(),
      articles_added: result.articles.length,
    });
  } catch (error: unknown) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
