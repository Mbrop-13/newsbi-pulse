import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PLAN_CONFIGS, type PlanTier } from "@/lib/plan-limits";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!;

// Map plan tier to Mercado Pago preapproval_plan IDs
const PLAN_IDS: Record<string, string> = {
  pro: process.env.MERCADOPAGO_PLAN_PRO_ID || "",
  max: process.env.MERCADOPAGO_PLAN_MAX_ID || "",
  ultra: process.env.MERCADOPAGO_PLAN_ULTRA_ID || "",
};

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json() as { plan: PlanTier };

    // Validate plan
    const planConfig = PLAN_CONFIGS[plan];
    if (!planConfig || planConfig.price === 0 || !PLAN_IDS[plan]) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    // Get authenticated user from Supabase cookie
    const authHeader = request.headers.get("authorization");
    let user = null;

    if (authHeader) {
      const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      user = data.user;
    }

    // Also try cookie-based auth
    if (!user) {
      const cookieHeader = request.headers.get("cookie") || "";
      const sbAccessToken = cookieHeader
        .split(";")
        .map(c => c.trim())
        .find(c => c.startsWith("sb-") && c.includes("-auth-token"));
      
      if (sbAccessToken) {
        const tokenValue = decodeURIComponent(sbAccessToken.split("=").slice(1).join("="));
        try {
          const parsed = JSON.parse(tokenValue);
          const accessToken = parsed?.[0] || parsed?.access_token;
          if (accessToken) {
            const { data } = await supabase.auth.getUser(accessToken);
            user = data.user;
          }
        } catch {}
      }
    }

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reclu.cl";

    // Create a preapproval (subscription) using the plan
    const body = {
      preapproval_plan_id: PLAN_IDS[plan],
      payer_email: user.email,
      external_reference: JSON.stringify({
        user_id: user.id,
        plan,
      }),
      back_url: `${siteUrl}/suscripcion?status=success&plan=${plan}`,
    };

    const res = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Checkout] MP Preapproval error:", res.status, errText);
      return NextResponse.json(
        { error: "Error al crear suscripción", details: errText },
        { status: 500 }
      );
    }

    const data = await res.json();

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
