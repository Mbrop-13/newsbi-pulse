import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { checkLimit } from "@/lib/check-limits";
import { z } from "zod";

const createSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^[A-Za-z0-9.^]+$/),
  target_price: z.number().finite().positive().max(1_000_000_000),
  condition: z.enum(["above", "below"]),
});

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.data.supabase
    .from("price_alerts")
    .select("id, symbol, target_price, condition, is_active, created_at")
    .eq("user_id", auth.data.user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[portfolio/alerts GET]", error.message);
    return NextResponse.json({ error: "No se pudieron cargar las alertas" }, { status: 500 });
  }

  return NextResponse.json({ alerts: data || [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const limitCheck = await checkLimit(auth.data.user.id, "price_alert");
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: "Has alcanzado el límite de alertas de tu plan.",
        code: "LIMIT_REACHED",
        upgradeRequired: limitCheck.upgradeRequired,
      },
      { status: 403 }
    );
  }

  const { data, error } = await auth.data.supabase
    .from("price_alerts")
    .insert({
      user_id: auth.data.user.id,
      symbol: parsed.data.symbol.toUpperCase(),
      target_price: parsed.data.target_price,
      condition: parsed.data.condition,
    })
    .select("id, symbol, target_price, condition, is_active, created_at")
    .single();

  if (error) {
    console.error("[portfolio/alerts POST]", error.message);
    return NextResponse.json({ error: "No se pudo crear la alerta" }, { status: 500 });
  }

  return NextResponse.json({ alert: data });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const id = req.nextUrl.searchParams.get("id") || "";
  if (!/^[0-9a-f-]{8,80}$/i.test(id)) {
    return NextResponse.json({ error: "Alerta inválida" }, { status: 400 });
  }

  const { error } = await auth.data.supabase
    .from("price_alerts")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.data.user.id);

  if (error) {
    console.error("[portfolio/alerts DELETE]", error.message);
    return NextResponse.json({ error: "No se pudo eliminar la alerta" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      id: z.string().uuid(),
      is_active: z.boolean(),
      notify: z.boolean().optional(),
      price: z.number().finite().optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { data, error } = await auth.data.supabase
    .from("price_alerts")
    .update({ is_active: parsed.data.is_active })
    .eq("id", parsed.data.id)
    .eq("user_id", auth.data.user.id)
    .select("id, symbol, target_price, condition")
    .maybeSingle();

  if (error) {
    console.error("[portfolio/alerts PATCH]", error.message);
    return NextResponse.json({ error: "No se pudo actualizar la alerta" }, { status: 500 });
  }

  if (parsed.data.notify && data && parsed.data.is_active === false) {
    const priceLabel =
      typeof parsed.data.price === "number" ? parsed.data.price.toFixed(2) : "el mercado";
    await auth.data.supabase.from("notifications").insert({
      user_id: auth.data.user.id,
      type: "price_alert",
      title: `Alerta: ${data.symbol} ${data.condition === "above" ? "superó" : "bajó de"} $${data.target_price}`,
      message: `${data.symbol} ahora está en $${priceLabel}.`,
    });
  }

  return NextResponse.json({ success: true, alert: data });
}
