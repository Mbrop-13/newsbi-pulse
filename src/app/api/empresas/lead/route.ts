import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { sendEmail } from "@/lib/email/azure-client";
import { enterpriseLeadNotificationEmail } from "@/lib/email/enterprise-templates";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SALES_EMAIL = process.env.SALES_EMAIL || "ventas@maverlang.cl";

const leadSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  company: z.string().min(2).max(200),
  rut: z.string().max(20).optional(),
  team_size: z.enum(["1-5", "6-20", "21-100", "100+"]).optional(),
  message: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("enterprise_leads")
      .insert({
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company,
        rut: parsed.data.rut ?? null,
        team_size: parsed.data.team_size ?? null,
        message: parsed.data.message ?? null,
        status: "new",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[empresas/lead] DB error:", error.message);
      return NextResponse.json({ error: "No se pudo guardar el lead" }, { status: 500 });
    }

    // Notificar al equipo de ventas (no bloqueante)
    try {
      const { subject, html } = enterpriseLeadNotificationEmail({
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company,
        rut: parsed.data.rut,
        teamSize: parsed.data.team_size,
        message: parsed.data.message,
      });
      await sendEmail({ to: SALES_EMAIL, subject, html });
    } catch (emailErr) {
      console.warn("[empresas/lead] No se pudo enviar email de notificación:", emailErr);
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error: any) {
    console.error("[empresas/lead] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
