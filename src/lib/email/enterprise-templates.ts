/**
 * Email templates for Maverlang Enterprise (B2B):
 *   - teamInvitationEmail: invitación a unirse a una organización
 *   - enterpriseLeadNotificationEmail: notificación al equipo de ventas sobre un nuevo lead
 *
 * Reutiliza el patrón visual de email-templates.ts (BRAND + baseLayout local).
 */

const BRAND = {
  primary: "#1890FF",
  dark: "#0F0F13",
  green: "#22ab94",
  red: "#f7525f",
  gray: "#6B7280",
  lightBg: "#f8fafc",
  logo: "https://maverlang.cl/icon-192x192.png",
  url: "https://maverlang.cl",
};

function baseLayout(content: string, preheader: string = ""): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Maverlang Empresas</title>
  <!--[if mso]><style>body{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.lightBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;font-size:1px;color:${BRAND.lightBg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.lightBg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid #f1f5f9;">
              <span style="font-size:22px;font-weight:900;color:${BRAND.dark};letter-spacing:-0.5px;">Maverlang</span>
              <span style="font-size:10px;font-weight:700;color:${BRAND.primary};background-color:rgba(24,144,255,0.1);padding:2px 6px;border-radius:4px;margin-left:6px;vertical-align:middle;">EMPRE SAS</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:12px;color:${BRAND.gray};line-height:1.5;">
                © ${new Date().getFullYear()} Maverlang — Inteligencia Artificial Financiera.<br>
                <a href="${BRAND.url}/empresas" style="color:${BRAND.primary};text-decoration:none;">maverlang.cl/empresas</a>
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

/**
 * Email de invitación a una organización
 */
export function teamInvitationEmail({
  inviteeEmail,
  orgName,
  inviterName,
  role,
  acceptUrl,
}: {
  inviteeEmail: string;
  orgName: string;
  inviterName: string;
  role: "owner" | "admin" | "member";
  acceptUrl: string;
}): { subject: string; html: string } {
  const roleLabel = role === "owner" ? "Propietario" : role === "admin" ? "Administrador" : "Miembro";
  const subject = `${inviterName} te invitó a unirte a ${orgName} en Maverlang`;

  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:${BRAND.dark};line-height:1.3;">Te invitaron a unirte a un equipo</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      <strong>${inviterName}</strong> te ha invitado a unirte al espacio de trabajo
      <strong>${orgName}</strong> en Maverlang como <strong>${roleLabel}</strong>.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Con Maverlang Empresas podrás acceder a agentes de IA financiera, análisis de portafolio compartido,
      alertas centralizadas y un panel de administración para todo tu equipo.
    </p>
    <p style="margin:24px 0;text-align:center;">
      <a href="${acceptUrl}" style="display:inline-block;background-color:${BRAND.primary};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;">Aceptar invitación</a>
    </p>
    <p style="margin:24px 0 0;font-size:13px;color:${BRAND.gray};line-height:1.5;">
      O copia y pega este enlace en tu navegador:<br>
      <a href="${acceptUrl}" style="color:${BRAND.primary};word-break:break-all;">${acceptUrl}</a>
    </p>
    <p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #f1f5f9;font-size:12px;color:${BRAND.gray};line-height:1.5;">
      Esta invitación es para <strong>${inviteeEmail}</strong>. Si no esperabas esta invitación, puedes ignorar este correo.
    </p>
  `;

  return { subject, html: baseLayout(content, `${inviterName} te invitó a ${orgName}`) };
}

/**
 * Notificación interna al equipo de ventas sobre un nuevo lead
 */
export function enterpriseLeadNotificationEmail({
  name,
  email,
  company,
  rut,
  teamSize,
  message,
}: {
  name: string;
  email: string;
  company: string;
  rut?: string | null;
  teamSize?: string | null;
  message?: string | null;
}): { subject: string; html: string } {
  const subject = `[Lead Empresas] ${company} — ${name}`;

  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:${BRAND.dark};">Nuevo lead de Plan Empresarial</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#374151;">
      <tr><td style="padding:6px 0;color:${BRAND.gray};width:120px;vertical-align:top;">Nombre:</td><td style="padding:6px 0;font-weight:600;">${name}</td></tr>
      <tr><td style="padding:6px 0;color:${BRAND.gray};vertical-align:top;">Email:</td><td style="padding:6px 0;"><a href="mailto:${email}" style="color:${BRAND.primary};">${email}</a></td></tr>
      <tr><td style="padding:6px 0;color:${BRAND.gray};vertical-align:top;">Empresa:</td><td style="padding:6px 0;font-weight:600;">${company}</td></tr>
      ${rut ? `<tr><td style="padding:6px 0;color:${BRAND.gray};vertical-align:top;">RUT:</td><td style="padding:6px 0;">${rut}</td></tr>` : ""}
      ${teamSize ? `<tr><td style="padding:6px 0;color:${BRAND.gray};vertical-align:top;">Tamaño equipo:</td><td style="padding:6px 0;">${teamSize}</td></tr>` : ""}
    </table>
    ${message ? `
      <p style="margin:20px 0 0;font-size:13px;color:${BRAND.gray};">Mensaje:</p>
      <p style="margin:8px 0 0;padding:16px;background-color:#f8fafc;border-radius:10px;font-size:14px;color:#374151;line-height:1.6;">${message}</p>
    ` : ""}
    <p style="margin:24px 0 0;font-size:13px;color:${BRAND.gray};">
      Contáctalo lo antes posible para agendar una demo.
    </p>
  `;

  return { subject, html: baseLayout(content, `Nuevo lead: ${company}`) };
}
