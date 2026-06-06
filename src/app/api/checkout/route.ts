import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLAN_CONFIGS, type PlanTier } from "@/lib/plan-limits";

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!;

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json() as { plan: PlanTier };

    // Validate plan
    const planConfig = PLAN_CONFIGS[plan];
    if (!planConfig || planConfig.price === 0) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    // Get authenticated user using SSR Supabase client (reads cookies automatically)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[Checkout] Auth error:", authError?.message);
      return NextResponse.json({ error: "No autenticado. Inicia sesión primero." }, { status: 401 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reclu.cl";

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    // Check if the user was referred by someone (20% discount)
    const { data: referralData } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_id", user.id)
      .maybeSingle();

    const isReferred = !!referralData;
    const finalPrice = isReferred ? Math.round(planConfig.price * 0.8) : planConfig.price;
    const planReason = isReferred 
      ? `Suscripción Reclu ${plan.toUpperCase()} — 7 días gratis + 20% Dscto Referido`
      : `Suscripción Reclu ${plan.toUpperCase()} — 7 días gratis`;

    // Create a preapproval (subscription) with 7-day free trial
    const body = {
      reason: planReason,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: finalPrice,
        currency_id: "CLP",
        free_trial: {
          frequency: 7,
          frequency_type: "days",
        },
      },
      payer_email: user.email,
      external_reference: JSON.stringify({
        user_id: user.id,
        plan,
        trial_end: trialEnd.toISOString(),
      }),
      back_url: `${siteUrl}/suscripcion?status=success&plan=${plan}`,
    };

    // Mask email for PII logs protection (GDPR compliance)
    const maskEmail = (email?: string) => {
      if (!email) return "anonymous";
      const [local, domain] = email.split("@");
      if (!domain) return "anonymous";
      return `${local[0]}***@${domain}`;
    };

    console.log("[Checkout] Creating preapproval for:", maskEmail(user.email), "plan:", plan, "amount:", finalPrice, "isReferred:", isReferred);

    const res = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Checkout] MP Preapproval error:", res.status, JSON.stringify(data));
      return NextResponse.json(
        { error: "Error al crear suscripción", details: data },
        { status: 500 }
      );
    }

    console.log("[Checkout] Preapproval created:", data.id, "init_point:", data.init_point);

    // data.init_point is the URL where the user enters payment details
    return NextResponse.json({ url: data.init_point });
  } catch (error: any) {
    console.error("[Checkout] Error:", error);
    return NextResponse.json(
      { error: "Error al crear checkout", details: error.message },
      { status: 500 }
    );
  }
}
