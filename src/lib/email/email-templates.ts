/**
 * Professional HTML email templates for Reclu
 * All templates are responsive, dark-mode compatible, and use inline styles for maximum email client compatibility.
 */

const BRAND = {
  primary: "#1890FF",
  dark: "#0F0F13",
  green: "#22ab94",
  red: "#f7525f",
  gray: "#6B7280",
  lightBg: "#f8fafc",
  logo: "https://reclu.cl/icon-192x192.png",
  url: "https://reclu.cl",
};

function baseLayout(content: string, preheader: string = ""): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reclu</title>
  <!--[if mso]><style>body{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.lightBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preheader -->
  <div style="display:none;font-size:1px;color:${BRAND.lightBg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.lightBg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:900;color:${BRAND.dark};letter-spacing:-0.5px;">Reclu</span>
                    <span style="font-size:10px;font-weight:700;color:${BRAND.primary};background-color:rgba(24,144,255,0.1);padding:2px 6px;border-radius:4px;margin-left:6px;vertical-align:middle;">IA</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;color:${BRAND.gray};">
                © ${new Date().getFullYear()} Reclu — Inteligencia de Noticias
              </p>
              <p style="margin:0;font-size:10px;color:#9CA3AF;">
                <a href="${BRAND.url}" style="color:${BRAND.primary};text-decoration:none;">reclu.cl</a> · 
                <a href="${BRAND.url}/configuracion" style="color:${BRAND.gray};text-decoration:none;">Gestionar notificaciones</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════
// PRICE ALERT EMAIL
// ═══════════════════════════════════════════════════
export function priceAlertEmail({
  symbol,
  currentPrice,
  targetPrice,
  condition,
  userName,
}: {
  symbol: string;
  currentPrice: number;
  targetPrice: number;
  condition: "above" | "below";
  userName?: string;
}): { subject: string; html: string } {
  const isAbove = condition === "above";
  const arrow = isAbove ? "↑" : "↓";
  const color = isAbove ? BRAND.green : BRAND.red;
  const conditionText = isAbove ? "por encima" : "por debajo";

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:64px;height:64px;border-radius:16px;background-color:${color}15;line-height:64px;font-size:28px;">${arrow}</div>
    </div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${BRAND.dark};text-align:center;letter-spacing:-0.3px;">
      Alerta de Precio Activada
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:${BRAND.gray};text-align:center;">
      ${userName ? `Hola ${userName}, t` : "T"}u alerta para <strong>${symbol}</strong> se ha disparado.
    </p>
    
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:12px;margin-bottom:28px;">
      <tr>
        <td style="padding:20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;">
                <span style="font-size:12px;font-weight:700;color:${BRAND.gray};text-transform:uppercase;letter-spacing:0.5px;">Activo</span>
              </td>
              <td style="padding:8px 0;text-align:right;">
                <span style="font-size:16px;font-weight:800;color:${BRAND.dark};">${symbol}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-top:1px solid #e5e7eb;">
                <span style="font-size:12px;font-weight:700;color:${BRAND.gray};text-transform:uppercase;letter-spacing:0.5px;">Precio Actual</span>
              </td>
              <td style="padding:8px 0;text-align:right;border-top:1px solid #e5e7eb;">
                <span style="font-size:18px;font-weight:900;color:${color};">$${currentPrice.toFixed(2)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-top:1px solid #e5e7eb;">
                <span style="font-size:12px;font-weight:700;color:${BRAND.gray};text-transform:uppercase;letter-spacing:0.5px;">Tu Objetivo</span>
              </td>
              <td style="padding:8px 0;text-align:right;border-top:1px solid #e5e7eb;">
                <span style="font-size:14px;font-weight:700;color:${BRAND.dark};">${conditionText} de $${targetPrice.toFixed(2)}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <div style="text-align:center;">
      <a href="${BRAND.url}/mercados/${encodeURIComponent(symbol)}" style="display:inline-block;padding:14px 32px;background-color:${BRAND.primary};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">
        Ver ${symbol} en Reclu →
      </a>
    </div>
  `;

  return {
    subject: `🔔 ${symbol} alcanzó $${currentPrice.toFixed(2)} — Alerta de Precio`,
    html: baseLayout(content, `${symbol} alcanzó $${currentPrice.toFixed(2)}, ${conditionText} de tu objetivo de $${targetPrice.toFixed(2)}`),
  };
}

// ═══════════════════════════════════════════════════
// WELCOME EMAIL
// ═══════════════════════════════════════════════════
export function welcomeEmail({ userName, email }: { userName?: string; email: string }): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${BRAND.dark};letter-spacing:-0.3px;">
      ¡Bienvenido a Reclu! 🚀
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:${BRAND.gray};line-height:1.7;">
      ${userName ? `Hola ${userName}, g` : "G"}racias por unirte a Reclu. Ahora tienes acceso a inteligencia de noticias potenciada por IA, mercados en tiempo real y alertas de precio personalizadas.
    </p>
    
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="padding:16px;background-color:#f0f9ff;border-radius:12px;border-left:4px solid ${BRAND.primary};">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:${BRAND.dark};">🎯 Configura tus alertas</p>
          <p style="margin:0;font-size:12px;color:${BRAND.gray};">Recibe notificaciones cuando un activo alcance el precio que te interesa.</p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:16px;background-color:#f0fdf4;border-radius:12px;border-left:4px solid ${BRAND.green};">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:${BRAND.dark};">📊 Arma tu portafolio</p>
          <p style="margin:0;font-size:12px;color:${BRAND.gray};">Sigue tus acciones favoritas y monitorea tu rendimiento.</p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:16px;background-color:#fef3c7;border-radius:12px;border-left:4px solid #f59e0b;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:${BRAND.dark};">🤖 Asistente IA</p>
          <p style="margin:0;font-size:12px;color:${BRAND.gray};">Pregúntale cualquier cosa sobre las noticias y el mercado.</p>
        </td>
      </tr>
    </table>
    
    <div style="text-align:center;">
      <a href="${BRAND.url}" style="display:inline-block;padding:14px 32px;background-color:${BRAND.primary};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;">
        Explorar Reclu →
      </a>
    </div>
  `;

  return {
    subject: "🚀 Bienvenido a Reclu — Tu inteligencia de noticias con IA",
    html: baseLayout(content, "Bienvenido a Reclu. Configura tu portafolio, alertas y asistente IA."),
  };
}

// ═══════════════════════════════════════════════════
// NEWSLETTER CONFIRMATION
// ═══════════════════════════════════════════════════
export function newsletterConfirmationEmail({ email }: { email: string }): { subject: string; html: string } {
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:64px;height:64px;border-radius:16px;background-color:rgba(24,144,255,0.1);line-height:64px;font-size:28px;">📬</div>
    </div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${BRAND.dark};text-align:center;">
      ¡Suscripción Confirmada!
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:${BRAND.gray};text-align:center;line-height:1.7;">
      Recibirás el <strong>Boletín Diario de Reclu</strong> cada mañana con las noticias más relevantes, analizadas por IA.
    </p>
    <div style="padding:20px;background-color:#f8fafc;border-radius:12px;text-align:center;margin-bottom:24px;">
      <p style="margin:0;font-size:12px;color:${BRAND.gray};">Suscrito con</p>
      <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:${BRAND.dark};">${email}</p>
    </div>
    <div style="text-align:center;">
      <a href="${BRAND.url}" style="display:inline-block;padding:14px 32px;background-color:${BRAND.primary};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;">
        Ir a Reclu →
      </a>
    </div>
  `;

  return {
    subject: "✅ Suscripción confirmada — Boletín Diario de Reclu",
    html: baseLayout(content, "Tu suscripción al boletín diario de Reclu ha sido confirmada."),
  };
}

// ═══════════════════════════════════════════════════
// GENERIC NOTIFICATION EMAIL
// ═══════════════════════════════════════════════════
export function notificationEmail({
  title,
  message,
  ctaText,
  ctaUrl,
}: {
  title: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:800;color:${BRAND.dark};letter-spacing:-0.2px;">
      ${title}
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:${BRAND.gray};line-height:1.7;">
      ${message}
    </p>
    ${ctaText && ctaUrl ? `
    <div style="text-align:center;">
      <a href="${ctaUrl}" style="display:inline-block;padding:14px 32px;background-color:${BRAND.primary};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;">
        ${ctaText} →
      </a>
    </div>` : ""}
  `;

  return {
    subject: title,
    html: baseLayout(content, message.substring(0, 100)),
  };
}
