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
  const conditionText = isAbove ? "por encima de" : "por debajo de";

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background-color:${color}15;color:${color};font-size:24px;font-weight:900;">
        ${arrow}
      </div>
    </div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${BRAND.dark};text-align:center;letter-spacing:-0.3px;">
      Alerta de Mercado
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:${BRAND.gray};text-align:center;line-height:1.6;">
      ${userName ? `Hola ${userName}, t` : "T"}u alerta configurada para <strong>${symbol}</strong> se ha activado.
    </p>
    
    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin-bottom:32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;font-weight:700;color:${BRAND.gray};text-transform:uppercase;letter-spacing:0.5px;">Activo</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:${BRAND.dark};">${symbol}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;font-weight:700;color:${BRAND.gray};text-transform:uppercase;letter-spacing:0.5px;">Precio Actual</p>
            <p style="margin:4px 0 0;font-size:24px;font-weight:900;color:${color};">$${currentPrice.toFixed(2)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding-top:16px;">
            <p style="margin:0;font-size:12px;font-weight:700;color:${BRAND.gray};text-transform:uppercase;letter-spacing:0.5px;">Condición Cumplida</p>
            <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:${BRAND.dark};">${conditionText.charAt(0).toUpperCase() + conditionText.slice(1)} $${targetPrice.toFixed(2)}</p>
          </td>
        </tr>
      </table>
    </div>
    
    <div style="text-align:center;">
      <a href="${BRAND.url}/mercados/${encodeURIComponent(symbol)}" style="display:inline-block;padding:14px 32px;background-color:${BRAND.primary};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;box-shadow:0 4px 6px -1px rgba(24,144,255,0.2);">
        Analizar ${symbol} en Reclu →
      </a>
    </div>
  `;

  return {
    subject: `🔔 ${symbol} alcanzó $${currentPrice.toFixed(2)} — Alerta de Reclu`,
    html: baseLayout(content, `${symbol} ha cruzado tu precio objetivo de $${targetPrice.toFixed(2)}. Inicia sesión para ver los detalles.`),
  };
}

// ═══════════════════════════════════════════════════
// WELCOME EMAIL
// ═══════════════════════════════════════════════════
export function welcomeEmail({ userName, email }: { userName?: string; email: string }): { subject: string; html: string } {
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg, ${BRAND.primary}, #60a5fa);color:#fff;font-size:28px;box-shadow:0 8px 16px rgba(24,144,255,0.25);">
        ✦
      </div>
    </div>
    <h1 style="margin:0 0 12px;font-size:26px;font-weight:900;color:${BRAND.dark};text-align:center;letter-spacing:-0.5px;">
      Bienvenido a Reclu
    </h1>
    <p style="margin:0 0 32px;font-size:16px;color:${BRAND.gray};text-align:center;line-height:1.6;padding:0 16px;">
      ${userName ? `Hola ${userName}, g` : "G"}racias por unirte. Tu cuenta está lista para explorar el mercado con inteligencia artificial en tiempo real.
    </p>
    
    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;padding:24px;margin-bottom:36px;">
      <h2 style="margin:0 0 20px;font-size:13px;font-weight:800;color:${BRAND.gray};text-transform:uppercase;letter-spacing:1px;text-align:center;">Empieza con estas herramientas</h2>
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td width="48" style="padding-right:16px;">
            <div style="width:48px;height:48px;border-radius:14px;background-color:rgba(24,144,255,0.1);display:flex;align-items:center;justify-content:center;color:${BRAND.primary};font-size:20px;text-align:center;line-height:48px;">
              🤖
            </div>
          </td>
          <td>
            <p style="margin:0 0 4px;font-size:16px;font-weight:800;color:${BRAND.dark};">R-AI Assistant</p>
            <p style="margin:0;font-size:13px;color:${BRAND.gray};line-height:1.5;">Haz preguntas financieras complejas, analiza empresas y gráficos al instante.</p>
          </td>
        </tr>
      </table>
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td width="48" style="padding-right:16px;">
            <div style="width:48px;height:48px;border-radius:14px;background-color:rgba(34,171,148,0.1);display:flex;align-items:center;justify-content:center;color:${BRAND.green};font-size:20px;text-align:center;line-height:48px;">
              📈
            </div>
          </td>
          <td>
            <p style="margin:0 0 4px;font-size:16px;font-weight:800;color:${BRAND.dark};">Portafolio Inteligente</p>
            <p style="margin:0;font-size:13px;color:${BRAND.gray};line-height:1.5;">Añade tus acciones para recibir noticias personalizadas y resúmenes diarios.</p>
          </td>
        </tr>
      </table>
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="48" style="padding-right:16px;">
            <div style="width:48px;height:48px;border-radius:14px;background-color:rgba(245,158,11,0.1);display:flex;align-items:center;justify-content:center;color:#f59e0b;font-size:20px;text-align:center;line-height:48px;">
              🔔
            </div>
          </td>
          <td>
            <p style="margin:0 0 4px;font-size:16px;font-weight:800;color:${BRAND.dark};">Alertas de Mercado</p>
            <p style="margin:0;font-size:13px;color:${BRAND.gray};line-height:1.5;">Configura notificaciones para cuando tus activos alcancen un precio clave.</p>
          </td>
        </tr>
      </table>
    </div>
    
    <div style="text-align:center;">
      <a href="${BRAND.url}/ai" style="display:inline-block;padding:16px 40px;background-color:${BRAND.primary};color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;border-radius:12px;box-shadow:0 8px 16px -4px rgba(24,144,255,0.3);letter-spacing:0.2px;">
        Comenzar a Invertir Mejor →
      </a>
    </div>
  `;

  return {
    subject: "Bienvenido a Reclu — Inteligencia de Noticias & Mercados 🚀",
    html: baseLayout(content, "Bienvenido a Reclu. Descubre tu asistente IA, alertas de precio y más."),
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

// ═══════════════════════════════════════════════════
// PAYMENT SUCCESS EMAIL
// ═══════════════════════════════════════════════════
export function paymentSuccessEmail({
  userName,
  planName,
  amount,
  billingCycle,
  nextBillingDate,
  paymentId,
}: {
  userName?: string;
  planName: string;
  amount: number;
  billingCycle: "monthly" | "annual";
  nextBillingDate: Date;
  paymentId: string;
}): { subject: string; html: string } {
  const formattedAmount = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  const formattedDate = nextBillingDate.toLocaleDateString("es-CL", { day: 'numeric', month: 'long', year: 'numeric' });
  const cycleText = billingCycle === "annual" ? "Anual" : "Mensual";

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background-color:${BRAND.green}15;color:${BRAND.green};font-size:24px;font-weight:900;">
        ✓
      </div>
    </div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${BRAND.dark};text-align:center;letter-spacing:-0.3px;">
      ¡Pago Confirmado!
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:${BRAND.gray};text-align:center;line-height:1.6;">
      ${userName ? `Hola ${userName}, h` : "H"}emos recibido el pago de tu suscripción a <strong>Reclu ${planName}</strong>. ¡Gracias por confiar en nosotros!
    </p>
    
    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin-bottom:32px;">
      <h2 style="margin:0 0 16px;font-size:14px;font-weight:800;color:${BRAND.dark};text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e2e8f0;padding-bottom:12px;">Detalles del Recibo</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;">
            <span style="font-size:13px;color:${BRAND.gray};">Plan</span>
          </td>
          <td style="padding:8px 0;text-align:right;">
            <span style="font-size:14px;font-weight:700;color:${BRAND.dark};">Reclu ${planName}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;">
            <span style="font-size:13px;color:${BRAND.gray};">Ciclo de facturación</span>
          </td>
          <td style="padding:8px 0;text-align:right;">
            <span style="font-size:14px;font-weight:700;color:${BRAND.dark};">${cycleText}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;">
            <span style="font-size:13px;color:${BRAND.gray};">Total pagado</span>
          </td>
          <td style="padding:8px 0;text-align:right;">
            <span style="font-size:16px;font-weight:800;color:${BRAND.green};">${formattedAmount}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-top:1px solid #e2e8f0;">
            <span style="font-size:12px;color:${BRAND.gray};">ID Transacción</span>
          </td>
          <td style="padding:8px 0;text-align:right;border-top:1px solid #e2e8f0;">
            <span style="font-size:12px;font-family:monospace;color:${BRAND.gray};">#${paymentId}</span>
          </td>
        </tr>
      </table>
    </div>

    <div style="background-color:rgba(24,144,255,0.05);border-radius:12px;padding:16px;text-align:center;margin-bottom:32px;">
      <p style="margin:0;font-size:13px;color:${BRAND.gray};">Tu próxima renovación será el <strong>${formattedDate}</strong>.</p>
    </div>
    
    <div style="text-align:center;">
      <a href="${BRAND.url}/ai" style="display:inline-block;padding:14px 32px;background-color:${BRAND.primary};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;box-shadow:0 4px 6px -1px rgba(24,144,255,0.2);">
        Ir al Asistente IA →
      </a>
    </div>
  `;

  return {
    subject: `Recibo de pago: Reclu ${planName} — Confirmado`,
    html: baseLayout(content, `Tu pago por ${formattedAmount} para el plan Reclu ${planName} ha sido procesado exitosamente.`),
  };
}
