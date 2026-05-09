import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/ses-client";
import { paymentSuccessEmail } from "@/lib/email/email-templates";
import type { PlanTier } from "@/lib/plan-limits";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // MercadoPago sends notifications with different types
    const { type, data } = body;

    if (type !== "payment") {
      return NextResponse.json({ received: true });
    }

    // Get payment details from MercadoPago
    const paymentId = data?.id;
    if (!paymentId) {
      return NextResponse.json({ error: "No payment ID" }, { status: 400 });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
    });

    if (!mpRes.ok) {
      console.error("[Webhook] Failed to fetch payment from MP:", await mpRes.text());
      return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
    }

    const payment = await mpRes.json();

    // Only process approved payments
    if (payment.status !== "approved") {
      console.log(`[Webhook] Payment ${paymentId} status: ${payment.status} — skipping`);
      return NextResponse.json({ received: true, status: payment.status });
    }

    // Parse external reference
    let externalRef: { user_id: string; plan: PlanTier; billing: string };
    try {
      externalRef = JSON.parse(payment.external_reference);
    } catch {
      console.error("[Webhook] Invalid external_reference:", payment.external_reference);
      return NextResponse.json({ error: "Invalid external reference" }, { status: 400 });
    }

    const { user_id, plan, billing } = externalRef;

    // Calculate period end
    const now = new Date();
    const periodEnd = new Date(now);
    if (billing === "annual") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Upsert subscription in Supabase
    const { error: subError } = await supabase
      .from("subscriptions")
      .upsert({
        user_id,
        tier: plan,
        status: "active",
        payment_provider: "mercadopago",
        external_subscription_id: paymentId.toString(),
        external_payer_id: payment.payer?.id?.toString() || null,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (subError) {
      console.error("[Webhook] Supabase upsert error:", subError);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    console.log(`[Webhook] ✅ User ${user_id} upgraded to ${plan} (${billing})`);

    // Send confirmation email
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(user_id);
      if (userData?.user?.email) {
        const planNames: Record<string, string> = { pro: "Pro", max: "Max", ultra: "Ultra" };
        const amount = payment.transaction_amount || 0;
        
        const { subject, html } = paymentSuccessEmail({
          userName: userData.user.user_metadata?.full_name || undefined,
          planName: planNames[plan] || "Pro",
          amount: amount,
          billingCycle: billing as "monthly" | "annual",
          nextBillingDate: periodEnd,
          paymentId: paymentId.toString(),
        });
        
        await sendEmail({ to: userData.user.email, subject, html });
      }
    } catch (emailErr) {
      console.error("[Webhook] Email notification failed:", emailErr);
      // Don't fail the webhook for email errors
    }

    return NextResponse.json({ success: true, plan, user_id });
  } catch (error: any) {
    console.error("[Webhook] Unexpected error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
