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
      // script-src incluye:
      //  - https://esm.sh y https://*.esm.sh: el bundler (esbuild-wasm) inlinea
      //    deps npm fetchéandolas desde esm.sh en tiempo de bundling.
      //  - https://cdn.tailwindcss.com: Tailwind Play CDN, inyectado en el
      //    iframe del preview para procesar clases Tailwind en runtime (esbuild
      //    no puede procesar @tailwind). Sin esto, las apps se ven sin estilos.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://hcaptcha.com https://*.hcaptcha.com https://www.googletagmanager.com https://www.google-analytics.com https://esm.sh https://*.esm.sh https://cdn.tailwindcss.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data: https://fonts.gstatic.com",
      // connect-src incluye los dominios del bundler de Sandpack (webbuilder):
      //  - https://*.codesandbox.io y https://codesandbox.io: el bundler
      //    descarga su runtime y mantiene el canal con el worker desde ahí.
      //  - https://col.csbops.io y https://*.csbops.io: endpoint de telemetría
      //    de CodeSandbox. El bundler hace POSTs aquí; si la CSP lo bloquea, el
      //    worker del iframe puede quedarse esperando y contribuir al
      //    ERR_CONNECTION_TIMED_OUT / TIME_OUT de la preview.
      // Sin estos, aunque el iframe esté permitido por frame-src, el runtime no
      // conecta bien y la preview se queda cargando hasta TIME_OUT.
      "connect-src 'self' https://*.supabase.co https://api.mercadopago.com https://api.openai.com https://openrouter.ai https://api.x.ai https://api.mapbox.com https://api.newsdata.io https://www.googleapis.com https://generativelanguage.googleapis.com https://*.upstash.io https://*.codesandbox.io https://codesandbox.io https://col.csbops.io https://*.csbops.io https://esm.sh https://*.esm.sh wss: ws:",
      // frame-src incluye los dominios del bundler de Sandpack (webbuilder):
      // - sandpack.codesandbox.io (worker/runtime por versión, ej. 2-19-8-sandpack.codesandbox.io)
      // - *.codesandbox.io  (cubre versiones nuevas y subdominios del bundler)
      // Sin esto el navegador bloquea el iframe del preview con:
      //   "Framing 'https://X-sandpack.codesandbox.io/' violates CSP frame-src"
      // lo que produce el TIME_OUT del bundler de Sandpack.
      "frame-src 'self' https://www.youtube.com https://*.mercadopago.cl https://*.mercadopago.com https://hcaptcha.com https://*.hcaptcha.com https://*.codesandbox.io https://codesandbox.io",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://*.mercadopago.cl https://*.mercadopago.com",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      // esbuild.wasm debe servirse con Content-Type: application/wasm.
      // Sin este header, Vercel lo sirve como application/octet-stream
      // → el navegador rechaza el compile/instantiate → esbuild.initialize()
      // falla → el bundler nunca corre → el código TS crudo se inyecta en el
      // iframe → "Unexpected identifier 'as'" + "Cannot read properties of
      // null (reading 'useContext')" + "Minified React error #31".
      {
        source: '/esbuild.wasm',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/wasm',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
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
