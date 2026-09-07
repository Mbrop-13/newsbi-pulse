import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email/azure-client";
import { newsletterConfirmationEmail } from "@/lib/email/email-templates";
import { rateLimit, rateLimitResponse, NEWSLETTER_LIMIT } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/auth-helpers";
import { captchaRequired, verifyHCaptcha } from "@/lib/captcha";

const subscribeSchema = z.object({
  email: z.string().email().max(200),
  captchaToken: z.string().max(4000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = await rateLimit(`newsletter:${ip}`, {
      ...NEWSLETTER_LIMIT,
      failClosedInProd: true,
    });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

    const raw = await request.json().catch(() => null);
    const parsed = subscribeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    if (captchaRequired()) {
      const ok = await verifyHCaptcha(parsed.data.captchaToken, ip);
      if (!ok) {
        return NextResponse.json({ error: "Verificación anti-bot fallida" }, { status: 403 });
      }
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();

    // Forward to Listmonk if configured
    const listmonkUrl = process.env.LISTMONK_API_URL;
    const listmonkUser = process.env.LISTMONK_API_USER;
    const listmonkKey = process.env.LISTMONK_API_KEY;

    if (listmonkUrl && listmonkUser && listmonkKey) {
      try {
        const listmonkRes = await fetch(`${listmonkUrl}/api/subscribers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${listmonkUser}:${listmonkKey}`).toString("base64")}`,
          },
          body: JSON.stringify({
            email: normalizedEmail,
            name: normalizedEmail.split("@")[0],
            status: "enabled",
            lists: [1],
            preconfirm_subscriptions: false,
          }),
        });

        if (!listmonkRes.ok) {
          const errData = await listmonkRes.json().catch(() => ({}));
          // 409 = already subscribed, treat as success
          if (listmonkRes.status !== 409) {
            console.error("[Newsletter] Listmonk error:", errData);
            return NextResponse.json({ error: "Error al suscribir" }, { status: 500 });
          }
        }
      } catch (listmonkErr) {
        console.error("[Newsletter] Listmonk connection error:", listmonkErr);
        // Don't fail — still send confirmation email
      }
    }

    // Send confirmation email via SES
    if (process.env.SES_FROM_EMAIL) {
      const { subject, html } = newsletterConfirmationEmail({ email: normalizedEmail });
      await sendEmail({
        to: normalizedEmail,
        subject,
        html,
        from: `Maverlang Newsletter <${process.env.SES_FROM_EMAIL}>`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Newsletter] Subscription error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
