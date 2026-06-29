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
    // Mitigates XSS (incl. the WebBuilder iframe previews) and injection.
    // 'unsafe-inline' for styles is required by Tailwind/inline styles; scripts are locked down.
    // 'unsafe-eval' kept for dev tooling; remove for prod if no eval-based lib is used.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://hcaptcha.com https://*.hcaptcha.com https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://api.mercadopago.com https://api.openai.com https://openrouter.ai https://api.x.ai https://api.mapbox.com https://api.newsdata.io https://www.googleapis.com https://generativelanguage.googleapis.com https://*.upstash.io wss: ws:",
      "frame-src 'self' https://www.youtube.com https://*.mercadopago.cl https://*.mercadopago.com https://hcaptcha.com https://*.hcaptcha.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://*.mercadopago.cl https://*.mercadopago.com",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
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
