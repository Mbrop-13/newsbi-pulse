import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/azure-client";
import { paymentSuccessEmail } from "@/lib/email/email-templates";
import type { PlanTier } from "@/lib/plan-limits";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!;

// Reverse lookup: plan ID → tier
const PLAN_ID_TO_TIER: Record<string, PlanTier> = {
  [process.env.MERCADOPAGO_PLAN_PRO_ID || ""]: "pro",
  [process.env.MERCADOPAGO_PLAN_MAX_ID || ""]: "max",
  [process.env.MERCADOPAGO_PLAN_ULTRA_ID || ""]: "ultra",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, action } = body;

    console.log(`[Webhook] Received: type=${type} action=${action} id=${data?.id}`);

    // ─── Handle subscription preapproval events ───
    if (type === "subscription_preapproval") {
      return handleSubscriptionEvent(data?.id);
    }

    // ─── Handle payment events (recurring charges) ───
    if (type === "payment") {
      return handlePaymentEvent(data?.id);
    }

    // Other event types — acknowledge
    return NextResponse.json({ received: true, type });
  } catch (error: any) {
    console.error("[Webhook] Unexpected error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

/**
 * Handle subscription lifecycle events (authorized, paused, cancelled, etc.)
 */
async function handleSubscriptionEvent(preapprovalId: string) {
  if (!preapprovalId) {
    return NextResponse.json({ error: "No preapproval ID" }, { status: 400 });
  }

  // Fetch subscription details from MP
  const res = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });

  if (!res.ok) {
    console.error("[Webhook] Failed to fetch preapproval:", await res.text());
    return NextResponse.json({ error: "Failed to verify subscription" }, { status: 500 });
  }

  const sub = await res.json();
  
  // Determine the plan tier from the plan ID
  const tier = PLAN_ID_TO_TIER[sub.preapproval_plan_id];
  
  // Try to get user_id from external_reference
  let userId: string | null = null;
  try {
    const ref = JSON.parse(sub.external_reference || "{}");
    userId = ref.user_id || null;
  } catch {}

  // If no user found from external_reference, look up by email
  if (!userId && sub.payer_email) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const matchedUser = users?.users?.find(u => u.email === sub.payer_email);
    userId = matchedUser?.id || null;
  }

  if (!userId || !tier) {
    console.error("[Webhook] Cannot resolve user or tier:", { userId, tier, planId: sub.preapproval_plan_id });
    return NextResponse.json({ error: "Cannot resolve user or tier" }, { status: 400 });
  }

  // Map MP subscription status to our status
  const statusMap: Record<string, string> = {
    authorized: "active",
    paused: "canceled",
    cancelled: "canceled",
    pending: "trialing",
  };
  const ourStatus = statusMap[sub.status] || "active";

  // Calculate period end (next billing date from MP)
  const periodEnd = sub.next_payment_date 
    ? new Date(sub.next_payment_date) 
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // fallback: +30 days

  // Upsert subscription in Supabase
  const { error: dbError } = await supabase
    .from("subscriptions")
    .upsert({
      user_id: userId,
      tier,
      status: ourStatus,
      payment_provider: "mercadopago",
      external_subscription_id: preapprovalId,
      external_payer_id: sub.payer_id?.toString() || null,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id",
    });

  if (dbError) {
    console.error("[Webhook] DB error:", dbError);
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  console.log(`[Webhook] ✅ Subscription ${sub.status} → User ${userId} → ${tier}`);

  // Send welcome email on activation
  if (sub.status === "authorized") {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      if (userData?.user?.email) {
        const planNames: Record<string, string> = { pro: "Pro", max: "Max", ultra: "Ultra" };
        const { subject, html } = paymentSuccessEmail({
          userName: userData.user.user_metadata?.full_name || undefined,
          planName: planNames[tier] || "Pro",
          amount: sub.auto_recurring?.transaction_amount || 0,
          billingCycle: "monthly",
          nextBillingDate: periodEnd,
          paymentId: preapprovalId,
        });
        await sendEmail({ to: userData.user.email, subject, html });
      }
    } catch (emailErr) {
      console.error("[Webhook] Email error:", emailErr);
    }
  }

  return NextResponse.json({ success: true, status: sub.status, tier, userId });
}

/**
 * Handle individual recurring payment events
 */
async function handlePaymentEvent(paymentId: string) {
  if (!paymentId) {
    return NextResponse.json({ error: "No payment ID" }, { status: 400 });
  }

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });

  if (!res.ok) {
    console.error("[Webhook] Failed to fetch payment:", await res.text());
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }

  const payment = await res.json();

  if (payment.status !== "approved") {
    console.log(`[Webhook] Payment ${paymentId} status: ${payment.status} — skipping`);
    return NextResponse.json({ received: true, status: payment.status });
  }

  // Parse external reference
  let externalRef: { user_id: string; plan: PlanTier };
  try {
    externalRef = JSON.parse(payment.external_reference || "{}");
  } catch {
    console.log("[Webhook] Payment without external_reference — likely recurring charge");
    return NextResponse.json({ received: true, note: "recurring_payment_logged" });
  }

  const { user_id, plan } = externalRef;
  if (!user_id || !plan) {
    return NextResponse.json({ received: true, note: "no_user_or_plan" });
  }

  // Extend subscription period
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { error } = await supabase
    .from("subscriptions")
    .upsert({
      user_id,
      tier: plan,
      status: "active",
      payment_provider: "mercadopago",
      external_subscription_id: paymentId.toString(),
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id",
    });

  if (error) {
    console.error("[Webhook] DB error on payment:", error);
  }

  console.log(`[Webhook] ✅ Payment ${paymentId} approved → User ${user_id} → ${plan}`);
  return NextResponse.json({ success: true, plan, user_id });
}
