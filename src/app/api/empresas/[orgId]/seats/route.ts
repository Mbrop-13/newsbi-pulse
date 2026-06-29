import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-helpers";
import { requireOrgMember } from "@/lib/enterprise-helpers";
import { createServiceClient } from "@/lib/supabase";
import {
  ENTERPRISE_PLANS,
  calculateSeatTotal,
  type EnterprisePlan,
} from "@/lib/plan-limits";

const seatsSchema = z.object({
  seats: z.number().int().min(1).max(1000),
});

/**
 * POST /api/empresas/[orgId]/seats
 * Ajusta el nº de asientos y genera un nuevo checkout MP (owner).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { orgId } = await params;
  const authz = await requireOrgMember(orgId, auth.data.user.id, auth.data.user.email, ["owner"]);
  if (!authz.ok) return authz.response;

  try {
    const body = await request.json().catch(() => null);
    const parsed = seatsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { seats } = parsed.data;
    const org = authz.data.org;
    const plan = (org.plan as EnterprisePlan) ?? "team";
    const config = ENTERPRISE_PLANS[plan];

    if (config.maxSeats !== -1 && seats > config.maxSeats) {
      return NextResponse.json(
        { error: `Máximo ${config.maxSeats} asientos para el plan ${config.name}` },
        { status: 400 }
      );
    }
    if (seats < config.minSeats) {
      return NextResponse.json(
        { error: `Mínimo ${config.minSeats} asientos` },
        { status: 400 }
      );
    }

    // No permitir bajar por debajo de miembros + invitaciones activas
    const service = createServiceClient();
    const [{ count: activeMembers }, { count: pendingInvites }] = await Promise.all([
      service.from("organization_members").select("*", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("status", "active"),
      service.from("organization_invitations").select("*", { count: "exact", head: true })
        .eq("organization_id", orgId).is("accepted_at", null),
    ]);
    const used = (activeMembers ?? 0) + (pendingInvites ?? 0);
    if (seats < used) {
      return NextResponse.json(
        { error: `No puedes bajar a ${seats} asientos: hay ${used} en uso (miembros + invitaciones)` },
        { status: 400 }
      );
    }

    // Actualizar asientos en la org + sub
    await service.from("organizations").update({ seat_count: seats }).eq("id", orgId);
    await service.from("organization_subscriptions").update({ seats }).eq("organization_id", orgId);

    // Generar checkout con el nuevo monto
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
      },
      payer_email: auth.data.user.email,
      external_reference: JSON.stringify({
        type: "enterprise",
        org_id: orgId,
        plan,
        seats,
        billing_cycle: org.billing_cycle,
      }),
      back_url: `${siteUrl}/empresas/dashboard?status=success&org=${orgId}`,
    };

    const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ACCESS_TOKEN}` },
      body: JSON.stringify(checkoutBody),
    });
    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      console.error("[seats] MP error:", mpRes.status, JSON.stringify(mpData));
      return NextResponse.json({
        ok: true,
        url: null,
        seats,
        warning: "Asientos actualizados. Completa el pago para reflejar el nuevo monto.",
      });
    }

    await service
      .from("organization_subscriptions")
      .update({ external_subscription_id: mpData.id })
      .eq("organization_id", orgId);

    return NextResponse.json({ ok: true, seats, url: mpData.init_point });
  } catch (error: any) {
    console.error("[seats] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
