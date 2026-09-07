import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { requireUser } from "@/lib/auth-helpers";
import { createServiceClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email/azure-client";
import { rateLimit, rateLimitResponse, NEWSLETTER_LIMIT } from "@/lib/rate-limit";

export async function POST() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const rl = await rateLimit(`delete-token:${auth.data.user.id}`, {
    ...NEWSLETTER_LIMIT,
    failClosedInProd: true,
  });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

  const email = auth.data.user.email;
  if (!email) {
    return NextResponse.json({ error: "La cuenta no tiene email" }, { status: 400 });
  }

  const raw = randomBytes(32).toString("hex");
  const hashed = createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const service = createServiceClient();
  const { error } = await service.from("user_preferences").upsert(
    {
      user_id: auth.data.user.id,
      delete_confirm_token: hashed,
      delete_token_expires_at: expiresAt,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[delete/request-token]", error.message);
    return NextResponse.json({ error: "No se pudo generar el token" }, { status: 500 });
  }

  try {
    await sendEmail({
      to: email,
      subject: "Confirma el borrado de tu cuenta Maverlang",
      html: `<p>Usa este código para confirmar el borrado permanente de tu cuenta. Expira en 15 minutos.</p><p><code>${raw}</code></p><p>Si no pediste esto, ignora este correo y cambia tu contraseña.</p>`,
    });
  } catch (err) {
    console.error("[delete/request-token] email", err);
    return NextResponse.json({ error: "No se pudo enviar el correo" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
