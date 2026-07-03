import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/azure-client";
import { paymentSuccessEmail } from "@/lib/email/email-templates";
import { verifyMercadoPagoSignature } from "@/lib/mercadopago/verify-signature";
import { grantReferralReward } from "@/lib/referrals";
import type { PlanTier } from "@/lib/plan-limits";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!;
const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET!;

// Reverse lookup: plan ID → tier
const PLAN_ID_TO_TIER: Record<string, PlanTier> = {
  [process.env.MERCADOPAGO_PLAN_PRO_ID || ""]: "pro",
  [process.env.MERCADOPAGO_PLAN_MAX_ID || ""]: "max",
  [process.env.MERCADOPAGO_PLAN_ULTRA_ID || ""]: "ultra",
};

export async function POST(request: NextRequest) {
  try {
    // ── Verify HMAC signature (ASVS 8.3.5 — event integrity) ──
    // MP signs with the application's webhook secret. Reject unsigned/forged events.
    const rawBody = await request.text();

    const signatureOk = verifyMercadoPagoSignature({
      signatureHeader: request.headers.get("x-signature"),
      requestId: request.headers.get("x-request-id"),
      dataId: request.headers.get("x-data-id"),
      secret: WEBHOOK_SECRET,
    });
    if (!signatureOk) {
      console.warn("[Webhook] Invalid or missing signature — rejecting");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let body: { type?: string; action?: string; data?: { id?: string } };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const { type, data, action } = body;

    console.log(`[Webhook] Verified: type=${type} action=${action} id=${data?.id}`);

    // ─── Handle subscription preapproval events ───
    if (type === "subscription_preapproval") {
      if (!data?.id) {
        return NextResponse.json({ error: "Missing subscription preapproval ID" }, { status: 400 });
      }
      return handleSubscriptionEvent(data.id);
    }

    // ─── Handle payment events (recurring charges) ───
    if (type === "payment") {
      if (!data?.id) {
        return NextResponse.json({ error: "Missing payment data ID" }, { status: 400 });
      }
      return handlePaymentEvent(data.id);
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

  // Parse external_reference una sola vez y detecta tipo
  let ref: { type?: string; user_id?: string; plan?: PlanTier; org_id?: string; seats?: number; billing_cycle?: string } = {};
  try {
    ref = JSON.parse(sub.external_reference || "{}");
  } catch {}

  // ── Ruta enterprise (organización) ──
  if (ref.type === "enterprise" && ref.org_id) {
    return handleEnterpriseSubscriptionEvent(preapprovalId, sub, ref);
  }

  // ── Ruta individual (usuario) ──
  let userId: string | null = ref.user_id || null;
  let tier: PlanTier | null = (ref.plan as PlanTier) || null;

  // Fallback to PLAN_ID_TO_TIER if not in external_reference
  if (!tier) {
    tier = PLAN_ID_TO_TIER[sub.preapproval_plan_id] || null;
  }

  // If no user found from external_reference, look up by email
  if (!userId && sub.payer_email) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const matchedUser = users?.users?.find(u => u.email === sub.payer_email);
    userId = matchedUser?.id || null;
  }

  if (!userId || !tier) {
    console.error("[Webhook] Cannot resolve user or tier:", { userId, tier, planId: sub.preapproval_plan_id, externalRef: sub.external_reference });
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

    // ── Programa de referidos: cualifica al referido que acaba de pagar ──
    // Idempotente (no-op si no tiene referrer o ya fue cualificado) y envuelto
    // en try/catch: un fallo del referido NUNCA afecta el procesamiento del pago.
    try {
      await grantReferralReward(userId);
    } catch (refErr) {
      console.error("[Webhook] Referral grant error:", refErr);
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
  let externalRef: { type?: string; user_id?: string; plan?: PlanTier; org_id?: string; seats?: number; billing_cycle?: string };
  try {
    externalRef = JSON.parse(payment.external_reference || "{}");
  } catch {
    console.log("[Webhook] Payment without external_reference — likely recurring charge");
    return NextResponse.json({ received: true, note: "recurring_payment_logged" });
  }

  // ── Enterprise payment ──
  if (externalRef.type === "enterprise" && externalRef.org_id) {
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabase
      .from("organization_subscriptions")
      .update({
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .eq("organization_id", externalRef.org_id);

    await supabase
      .from("organizations")
      .update({ status: "active", current_period_end: periodEnd.toISOString() })
      .eq("id", externalRef.org_id);

    console.log(`[Webhook] ✅ Enterprise payment ${paymentId} → org ${externalRef.org_id}`);
    return NextResponse.json({ success: true, org_id: externalRef.org_id });
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

/**
 * Handle enterprise (organization) subscription lifecycle events.
 */
async function handleEnterpriseSubscriptionEvent(
  preapprovalId: string,
  sub: any,
  ref: { org_id?: string; plan?: string; seats?: number; billing_cycle?: string }
) {
  const statusMap: Record<string, string> = {
    authorized: "active",
    paused: "canceled",
    cancelled: "canceled",
    pending: "trial",
  };
  const ourStatus = statusMap[sub.status] || "active";

  const periodEnd = sub.next_payment_date
    ? new Date(sub.next_payment_date)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Actualizar organization_subscriptions
  const { error: subErr } = await supabase
    .from("organization_subscriptions")
    .update({
      status: ourStatus,
      external_subscription_id: preapprovalId,
      external_payer_id: sub.payer_id?.toString() || null,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      ...(ref.plan ? { plan: ref.plan } : {}),
      ...(ref.seats ? { seats: ref.seats } : {}),
      ...(ref.billing_cycle ? { billing_cycle: ref.billing_cycle } : {}),
    })
    .eq("organization_id", ref.org_id!);

  if (subErr) {
    console.error("[Webhook] Enterprise sub DB error:", subErr);
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  // Sincronizar la org principal
  await supabase
    .from("organizations")
    .update({
      status: ourStatus,
      current_period_end: periodEnd.toISOString(),
      ...(ref.plan ? { plan: ref.plan } : {}),
      ...(ref.seats ? { seat_count: ref.seats } : {}),
      ...(ref.billing_cycle ? { billing_cycle: ref.billing_cycle } : {}),
    })
    .eq("id", ref.org_id!);

  console.log(`[Webhook] ✅ Enterprise sub ${sub.status} → org ${ref.org_id} (${ref.plan})`);
  return NextResponse.json({ success: true, status: sub.status, org_id: ref.org_id });
}
