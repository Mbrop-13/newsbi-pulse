/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    // ── Content-Security-Policy (ASVS 7.2.1) ──
    // Mitiga XSS (incl. el WebBuilder) e inyección.
    //
    // NOTA de seguridad (deuda técnica M-1):
    //  - 'unsafe-inline' en script-src es necesario por Next.js (estilos inline
    //    y, en algunos modos, hoisting de scripts). La migración a nonces por-
    //    request ('nonce-<random>') lo eliminaría a costa de middleware custom.
    //  - 'unsafe-eval' se mantiene sólo porque Tailwind Play CDN y Babel
    //    standalone lo requieren en el iframe de preview del canvas. Si se
    //    sirve el preview desde un subdominio sandbox aislado, se puede quitar
    //    del CSP principal.
    //  - report-to dirige las violaciones a un endpoint configurable para
    //    detectar intentos de XSS / CSP bypass en producción.
    const cspReportUri = process.env.CSP_REPORT_URI || "/api/csp-report";
    const isProd = process.env.NODE_ENV === "production";
    // En dev mantenemos unsafe-eval para HMR; en prod lo dejamos activo sólo
    // mientras la preview dependa de él (ver NOTA arriba).
    const scriptSrc = isProd
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://hcaptcha.com https://*.hcaptcha.com https://www.googletagmanager.com https://www.google-analytics.com https://esm.sh https://*.esm.sh https://unpkg.com https://cdn.tailwindcss.com"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://hcaptcha.com https://*.hcaptcha.com https://www.googletagmanager.com https://www.google-analytics.com https://esm.sh https://*.esm.sh https://unpkg.com https://cdn.tailwindcss.com";

    const csp = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://api.mercadopago.com https://api.openai.com https://openrouter.ai https://api.x.ai https://api.mapbox.com https://api.newsdata.io https://www.googleapis.com https://generativelanguage.googleapis.com https://*.upstash.io https://*.codesandbox.io https://codesandbox.io https://col.csbops.io https://*.csbops.io https://unpkg.com https://esm.sh https://*.esm.sh wss: ws:",
      "frame-src 'self' https://www.youtube.com https://*.mercadopago.cl https://*.mercadopago.com https://hcaptcha.com https://*.hcaptcha.com https://*.codesandbox.io https://codesandbox.io",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://*.mercadopago.cl https://*.mercadopago.com",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
      // ── Reporting (ASVS 14.x) ──
      // report-uri está deprecated pero algunos navegadores aún lo usan.
      // report-to es el moderno; requiere definir el endpoint abajo.
      `report-uri ${cspReportUri}`,
      `report-to csp-endpoint`,
    ].join("; ");

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // microphone=(self) es obligatorio para la Web Speech API de la
            // barra de input: con microphone=() el navegador bloquea el
            // micrófono de raíz (error "not-allowed") sin mostrar diálogo de
            // permiso. (self) lo permite en el propio origen únicamente.
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=(), interest-cohort=()',
          },
          // Reporting API: agrupa violaciones y las POSTea al endpoint.
          {
            key: 'Reporting-Endpoints',
            value: `csp-endpoint="${cspReportUri}"`,
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/suscripciones',
        destination: '/suscripcion',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
