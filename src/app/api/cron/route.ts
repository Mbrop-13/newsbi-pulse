import { NextRequest, NextResponse } from "next/server";
import { runNewsPipeline } from "@/lib/services/news-pipeline";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// ── Adaptive Cron Job Handler ─────────────────────
// Called by QStash/external cron every 10 minutes
// Internally decides whether to run based on Chile timezone
//
// Frequency by Chile hour:
//   00-07 → every 60 min (madrugada)
//   07-09 → every 15 min (pre-apertura)
//   09-17 → every 10 min (mercado abierto)
//   17-21 → every 20 min (post-mercado)
//   21-24 → every 30 min (noche)

function getChileHour(): number {
  const now = new Date();
  // Chile is UTC-4 (standard) / UTC-3 (DST)
  const chileTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Santiago' }));
  return chileTime.getHours();
}

function getMinIntervalMinutes(hour: number): number {
  if (hour >= 0 && hour < 7) return 60;     // Madrugada
  if (hour >= 7 && hour < 9) return 15;     // Pre-apertura
  if (hour >= 9 && hour < 17) return 10;    // Mercado abierto
  if (hour >= 17 && hour < 21) return 20;   // Post-mercado
  return 30;                                 // Noche
}

export async function GET(request: NextRequest) {
  try {
    // ── Auth: Accept QStash signature, cron secret, or manual trigger ──
    const authHeader = request.headers.get("authorization");
    const upstashSignature = request.headers.get("upstash-signature");
    const cronSecret = process.env.CRON_SECRET;
    const isManual = request.nextUrl.searchParams.get("manual") === "true";

    // Verify authorization
    if (!isManual && !upstashSignature) {
      if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        console.warn("[CRON] Unauthorized");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // ── Adaptive frequency check ──
    const chileHour = getChileHour();
    const minInterval = getMinIntervalMinutes(chileHour);

    if (!isManual) {
      // Check last run time from Supabase
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: lastRun } = await supabase
            .from('pipeline_runs')
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (lastRun) {
            const minutesSinceLastRun = (Date.now() - new Date(lastRun.created_at).getTime()) / 60000;
            
            if (minutesSinceLastRun < minInterval) {
              console.log(`[CRON] Skipped: ${minutesSinceLastRun.toFixed(0)}min since last run, need ${minInterval}min (Chile ${chileHour}:00)`);
              return NextResponse.json({
                skipped: true,
                reason: `${minutesSinceLastRun.toFixed(0)}min < ${minInterval}min interval`,
                chile_hour: chileHour,
                next_eligible_in: `${(minInterval - minutesSinceLastRun).toFixed(0)}min`,
              });
            }
          }
        }
      } catch (err) {
        // pipeline_runs table might not exist yet — continue anyway
        console.warn("[CRON] Could not check last run:", err);
      }
    }

    console.log(`[CRON] Running pipeline (Chile ${chileHour}:00, interval: ${minInterval}min, manual: ${isManual})`);
    
    // ── Execute pipeline ──
    const result = await runNewsPipeline();

    if (!result.success) {
      console.error(`[CRON] Pipeline failed: ${result.error}`);
      return NextResponse.json({
        success: false,
        error: result.error,
        step: result.step,
      }, { status: 500 });
    }

    console.log(`[CRON] ✅ ${result.stats?.saved || 0} articles saved`);

    return NextResponse.json({
      success: true,
      chile_hour: chileHour,
      interval_minutes: minInterval,
      timestamp: new Date().toISOString(),
      stats: result.stats,
    });
  } catch (error: unknown) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

// Also support POST (QStash sends POST by default)
export async function POST(request: NextRequest) {
  return GET(request);
}
