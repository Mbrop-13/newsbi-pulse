import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/azure-client";
import { activationEmail, trialExpiringEmail, weeklyDigestEmail } from "@/lib/email/email-templates";
import { formatCLP } from "@/lib/plan-limits";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, number> = {};

  try {
    // ═══════════════════════════════════════════
    // 1. ACTIVATION EMAIL (Day 2 — users who haven't used AI)
    // ═══════════════════════════════════════════
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStart = twoDaysAgo.toISOString().slice(0, 10) + "T00:00:00Z";
    const twoDaysAgoEnd = twoDaysAgo.toISOString().slice(0, 10) + "T23:59:59Z";

    const { data: newUsers } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .gte("created_at", twoDaysAgoStart)
      .lte("created_at", twoDaysAgoEnd);

    let activationSent = 0;
    if (newUsers) {
      for (const user of newUsers) {
        if (!user.email) continue;
        // Check if they've used AI
        const { data: usage } = await supabase
          .from("lifetime_usage")
          .select("ai_messages_total")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!usage || (usage.ai_messages_total || 0) === 0) {
          const { subject, html } = activationEmail({ userName: user.full_name });
          await sendEmail({ to: user.email, subject, html });
          activationSent++;
        }
      }
    }
    results.activation_emails = activationSent;

    // ═══════════════════════════════════════════
    // 2. TRIAL EXPIRING EMAIL (2 days before trial ends)
    // ═══════════════════════════════════════════
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const targetDate = twoDaysFromNow.toISOString().slice(0, 10);

    const { data: trialingSubs } = await supabase
      .from("subscriptions")
      .select("user_id, tier, trial_end")
      .eq("status", "trialing")
      .gte("trial_end", targetDate + "T00:00:00Z")
      .lte("trial_end", targetDate + "T23:59:59Z");

    let trialSent = 0;
    if (trialingSubs) {
      for (const sub of trialingSubs) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", sub.user_id)
          .single();

        if (!profile?.email) continue;

        // Get usage stats
        const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
        const { data: usage } = await supabase
          .from("monthly_usage")
          .select("ai_messages, tts_audios")
          .eq("user_id", sub.user_id)
          .eq("month", currentMonth)
          .maybeSingle();

        const prices: Record<string, number> = { pro: 22990, max: 44990, ultra: 79990 };
        const { subject, html } = trialExpiringEmail({
          userName: profile.full_name,
          planName: sub.tier.charAt(0).toUpperCase() + sub.tier.slice(1),
          daysLeft: 2,
          aiMessagesUsed: usage?.ai_messages || 0,
          ttsUsed: usage?.tts_audios || 0,
          price: formatCLP(prices[sub.tier] || 22990),
        });

        await sendEmail({ to: profile.email, subject, html });
        trialSent++;
      }
    }
    results.trial_expiring_emails = trialSent;

    // ═══════════════════════════════════════════
    // 3. WEEKLY DIGEST (Mondays only)
    // ═══════════════════════════════════════════
    const today = new Date();
    if (today.getDay() === 1) { // Monday
      // Get top 5 articles from the past week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: topArticles } = await supabase
        .from("news_articles")
        .select("title, category, slug")
        .gte("published_at", weekAgo.toISOString())
        .order("relevance_score", { ascending: false })
        .limit(5);

      if (topArticles && topArticles.length > 0) {
        // Get all active users with email
        const { data: activeProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .not("email", "is", null)
          .limit(500); // Batch limit

        let digestSent = 0;
        if (activeProfiles) {
          for (const profile of activeProfiles) {
            if (!profile.email) continue;
            const { subject, html } = weeklyDigestEmail({
              userName: profile.full_name,
              topArticles: topArticles as any,
            });
            await sendEmail({ to: profile.email, subject, html });
            digestSent++;
          }
        }
        results.weekly_digest_emails = digestSent;
      }
    }

    console.log("[Email Cron] Results:", results);
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("[Email Cron] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
