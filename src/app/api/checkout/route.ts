import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@supabase/supabase-js";
import { PLAN_CONFIGS, getAnnualMonthlyPrice, type PlanTier } from "@/lib/plan-limits";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { plan, billing } = await request.json() as { plan: PlanTier; billing: "monthly" | "annual" };

    // Validate plan
    const planConfig = PLAN_CONFIGS[plan];
    if (!planConfig || planConfig.price === 0) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    // Get authenticated user
    const authHeader = request.headers.get("cookie") || "";
    const { data: { user } } = await supabase.auth.getUser(
      // Extract token from cookie if available
      request.headers.get("authorization")?.replace("Bearer ", "") || undefined
    );

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Calculate price
    const monthlyPrice = billing === "annual" 
      ? getAnnualMonthlyPrice(plan)
      : planConfig.price;
    
    const totalPrice = billing === "annual" ? monthlyPrice * 12 : monthlyPrice;

    // Create MercadoPago preference
    const client = new MercadoPagoConfig({ 
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!
    });

    const preference = new Preference(client);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reclu.cl";

    const result = await preference.create({
      body: {
        items: [
          {
            id: `reclu-${plan}-${billing}`,
            title: `Reclu ${planConfig.name} — ${billing === "annual" ? "Anual" : "Mensual"}`,
            description: `Suscripción ${planConfig.name} de Reclu. ${billing === "annual" ? "Pago anual con 20% de descuento." : "Pago mensual."}`,
            quantity: 1,
            unit_price: totalPrice,
            currency_id: "CLP",
          },
        ],
        payer: {
          email: user.email || "",
        },
        back_urls: {
          success: `${siteUrl}/suscripcion?status=success&plan=${plan}`,
          failure: `${siteUrl}/suscripcion?status=failure`,
          pending: `${siteUrl}/suscripcion?status=pending`,
        },
        auto_return: "approved",
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
        external_reference: JSON.stringify({
          user_id: user.id,
          plan,
          billing,
        }),
        statement_descriptor: "RECLU",
      },
    });

    return NextResponse.json({ url: result.init_point });
  } catch (error: any) {
    console.error("[Checkout] Error:", error);
    return NextResponse.json(
      { error: "Error al crear checkout", details: error.message },
      { status: 500 }
    );
  }
}
