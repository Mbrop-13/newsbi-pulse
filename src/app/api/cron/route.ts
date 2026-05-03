import { NextRequest, NextResponse } from "next/server";
import { runNewsPipeline } from "@/lib/services/news-pipeline";
import { createClient } from "@supabase/supabase-js";
import YahooFinance from "yahoo-finance2";
import { sendEmail } from "@/lib/email/ses-client";
import { priceAlertEmail } from "@/lib/email/email-templates";

const yf = new YahooFinance();

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
  if (hour >= 0 && hour < 7) return 120;    // Madrugada (cada 2 horas)
  if (hour >= 7 && hour < 18) return 30;     // Horario comercial (cada 30 min)
  return 60;                                 // Noche (cada hora)
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

    // ── Check Price Alerts ──
    let alertsTriggered = 0;
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
        alertsTriggered = await checkPriceAlerts(supabaseAdmin);
      }
    } catch (err) {
      console.error("[CRON] Failed to check price alerts:", err);
    }

    return NextResponse.json({
      success: true,
      chile_hour: chileHour,
      interval_minutes: minInterval,
      timestamp: new Date().toISOString(),
      stats: { ...result.stats, alerts_triggered: alertsTriggered },
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

// ── Background Price Alerts Worker ─────────────────────
async function checkPriceAlerts(supabase: any): Promise<number> {
  try {
    // Note: We do a simple select. user_preferences might not exist for all users if they haven't saved settings,
    // so we handle it gracefully if the join fails.
    const { data: alerts, error } = await supabase
      .from("price_alerts")
      .select("*, user_preferences(notify_email, notify_sms, notify_push)")
      .eq("is_active", true);

    // If relation error, fallback to normal select
    let activeAlerts = alerts;
    if (error) {
      const { data: fallbackAlerts } = await supabase.from("price_alerts").select("*").eq("is_active", true);
      activeAlerts = fallbackAlerts;
    }

    if (!activeAlerts || activeAlerts.length === 0) return 0;

    const symbolsToFetch = [...new Set(activeAlerts.map((a: any) => a.symbol))] as string[];
    const quotes = await yf.quote(symbolsToFetch);
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
    
    let triggeredCount = 0;

    for (const alert of activeAlerts) {
      const liveData = quotesArray.find((q: any) => q.symbol === alert.symbol);
      if (!liveData) continue;

      const currentPrice = liveData.regularMarketPrice;
      if (!currentPrice) continue;

      const triggered = 
        (alert.condition === "above" && currentPrice >= alert.target_price) || 
        (alert.condition === "below" && currentPrice <= alert.target_price);

      if (triggered) {
        triggeredCount++;
        
        // 1. Deactivate alert
        await supabase.from("price_alerts").update({ is_active: false }).eq("id", alert.id);
        
        // 2. Create In-App Notification
        const prefs = Array.isArray(alert.user_preferences) ? alert.user_preferences[0] : alert.user_preferences;
        const pushEnabled = prefs?.notify_push !== false; // default true
        
        if (pushEnabled) {
          await supabase.from("notifications").insert({
            user_id: alert.user_id,
            type: "price_alert",
            title: `🔔 Alerta de Precio: ${alert.symbol}`,
            message: `${alert.symbol} alcanzó $${currentPrice.toFixed(2)}. Tu alerta de ${alert.condition === "above" ? "por encima" : "por debajo"} de $${alert.target_price} se ha disparado.`
          });
        }
        
        // 3. AWS SES Email Notification
        if (prefs?.notify_email) {
          try {
            // Get user email from Supabase Auth
            const { data: userData } = await supabase.auth.admin.getUserById(alert.user_id);
            const userEmail = userData?.user?.email;
            if (userEmail) {
              const { subject, html } = priceAlertEmail({
                symbol: alert.symbol,
                currentPrice,
                targetPrice: alert.target_price,
                condition: alert.condition,
                userName: userData.user?.user_metadata?.full_name || undefined,
              });
              await sendEmail({ to: userEmail, subject, html });
              console.log(`[CRON] Price alert email sent to ${userEmail} for ${alert.symbol}`);
            }
          } catch (emailErr) {
            console.error(`[CRON] Failed to send price alert email for ${alert.symbol}:`, emailErr);
          }
        }
      }
    }
    
    return triggeredCount;
  } catch (err) {
    console.error("[CRON] Price Alerts Logic Error:", err);
    return 0;
  }
}
