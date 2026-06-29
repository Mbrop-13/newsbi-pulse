import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-helpers";
import { createServiceClient } from "@/lib/supabase";
import {
  ENTERPRISE_PLANS,
  calculateSeatTotal,
  type EnterprisePlan,
  type BillingCycle,
} from "@/lib/plan-limits";
import { ensureUniqueSlug, slugify } from "@/lib/enterprise-helpers";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  rut: z.string().max(20).optional(),
  plan: z.enum(["team", "business", "enterprise"]) as z.ZodType<EnterprisePlan>,
  seats: z.number().int().min(1).max(1000),
  billing_cycle: z.enum(["monthly", "annual"]).default("monthly"),
});

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, rut, plan, seats, billing_cycle } = parsed.data;
    const config = ENTERPRISE_PLANS[plan];

    // Validar asientos contra min/max del plan
    if (config.maxSeats !== -1 && seats > config.maxSeats) {
      return NextResponse.json(
        { error: `Máximo ${config.maxSeats} asientos para el plan ${config.name}` },
        { status: 400 }
      );
    }
    if (seats < config.minSeats) {
      return NextResponse.json(
        { error: `Mínimo ${config.minSeats} asientos para el plan ${config.name}` },
        { status: 400 }
      );
    }

    // Enterprise = contacto de ventas, no checkout automático
    if (plan === "enterprise") {
      return NextResponse.json(
        { error: "Para Enterprise, contáctanos en /empresas (formulario de ventas)", redirect: "/empresas#contacto" },
        { status: 400 }
      );
    }

    const service = createServiceClient();
    const slug = await ensureUniqueSlug(slugify(name));

    // Período de prueba de 14 días
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 14);

    // 1. Crear la organización
    const { data: org, error: orgErr } = await service
      .from("organizations")
      .insert({
        name,
        slug,
        rut: rut ?? null,
        billing_email: auth.data.user.email ?? null,
        plan,
        seat_count: seats,
        billing_cycle,
        status: "trial",
        current_period_end: periodEnd.toISOString(),
        created_by: auth.data.user.id,
      })
      .select("*")
      .single();

    if (orgErr || !org) {
      console.error("[empresas/create] org error:", orgErr?.message);
      return NextResponse.json({ error: "No se pudo crear la organización" }, { status: 500 });
    }

    // 2. Crear membresía owner
    const { error: memberErr } = await service.from("organization_members").insert({
      organization_id: org.id,
      user_id: auth.data.user.id,
      role: "owner",
      status: "active",
    });

    if (memberErr) {
      console.error("[empresas/create] member error:", memberErr.message);
      // Rollback: borrar org
      await service.from("organizations").delete().eq("id", org.id);
      return NextResponse.json({ error: "No se pudo crear la membresía" }, { status: 500 });
    }

    // 3. Crear suscripción organizacional en trial
    const { error: subErr } = await service.from("organization_subscriptions").insert({
      organization_id: org.id,
      plan,
      seats,
      status: "trial",
      billing_cycle: billing_cycle as BillingCycle,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
    });

    if (subErr) {
      console.error("[empresas/create] sub error:", subErr.message);
    }

    // 4. Generar checkout MercadoPago (preapproval) — empresa
    const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://maverlang.cl";
    const amount = calculateSeatTotal(plan, seats);

    const checkoutBody = {
      reason: `Maverlang Empresas ${config.name} — ${seats} asientos`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "CLP",
        free_trial: {
          frequency: 14,
          frequency_type: "days",
        },
      },
      payer_email: auth.data.user.email,
      external_reference: JSON.stringify({
        type: "enterprise",
        org_id: org.id,
        plan,
        seats,
        billing_cycle,
      }),
      back_url: `${siteUrl}/empresas/dashboard?status=success&org=${org.id}`,
    };

    const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(checkoutBody),
    });

    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      console.error("[empresas/create] MP error:", mpRes.status, JSON.stringify(mpData));
      // La org se creó igual (en trial); el usuario puede pagar más tarde
      return NextResponse.json({
        ok: true,
        org_id: org.id,
        url: null,
        warning: "Organización creada en prueba. Completa el pago para activar.",
      });
    }

    // Guardar external_subscription_id
    await service
      .from("organization_subscriptions")
      .update({ external_subscription_id: mpData.id })
      .eq("organization_id", org.id);

    return NextResponse.json({
      ok: true,
      org_id: org.id,
      url: mpData.init_point,
    });
  } catch (error: any) {
    console.error("[empresas/create] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
