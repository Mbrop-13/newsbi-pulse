import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { checkLimit } from "@/lib/check-limits";
import { z } from "zod";

const addSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^[A-Za-z0-9.^]+$/, "Símbolo inválido"),
  company_name: z.string().trim().min(1).max(200),
});

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.data.supabase
    .from("portfolios")
    .select("id, symbol, company_name, shares, average_price, created_at")
    .eq("user_id", auth.data.user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[portfolio GET]", error.message);
    return NextResponse.json({ error: "No se pudo cargar el portafolio" }, { status: 500 });
  }

  return NextResponse.json({ assets: data || [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const limitCheck = await checkLimit(auth.data.user.id, "portfolio_asset");
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: "Has alcanzado el límite de activos de tu plan.",
        code: "LIMIT_REACHED",
        upgradeRequired: limitCheck.upgradeRequired,
      },
      { status: 403 }
    );
  }

  const symbol = parsed.data.symbol.toUpperCase();
  const { data, error } = await auth.data.supabase
    .from("portfolios")
    .insert({
      user_id: auth.data.user.id,
      symbol,
      company_name: parsed.data.company_name,
    })
    .select("id, symbol, company_name, shares, average_price")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: `${symbol} ya está en tu portafolio.` }, { status: 409 });
    }
    console.error("[portfolio POST]", error.message);
    return NextResponse.json({ error: "No se pudo agregar el activo" }, { status: 500 });
  }

  return NextResponse.json({ asset: data });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim().toUpperCase();
  if (!symbol || symbol.length > 20) {
    return NextResponse.json({ error: "Símbolo inválido" }, { status: 400 });
  }

  const { error } = await auth.data.supabase
    .from("portfolios")
    .delete()
    .eq("user_id", auth.data.user.id)
    .eq("symbol", symbol);

  if (error) {
    console.error("[portfolio DELETE]", error.message);
    return NextResponse.json({ error: "No se pudo eliminar el activo" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
