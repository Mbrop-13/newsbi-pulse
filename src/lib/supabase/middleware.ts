import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })



  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // NOTE: we intentionally use getSession() instead of getUser() here.
  // getUser() makes a blocking network call to the Supabase auth server on
  // EVERY request (200-500ms), which is the dominant latency cost of the
  // middleware. getSession() reads the JWT from the cookie locally (no network).
  // Token validity is still enforced where it matters: each protected API
  // route and page calls getUser() / verifies the session itself
  // (defense-in-depth). The middleware's job is only coarse access control:
  // keep anonymous users out of /admin and non-public /api routes.
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  // The assistant route is no longer protected here because it has its own unauthenticated landing page.

  // Protect /admin routes: require authentication
  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Protect /api/admin API routes: require authentication
  if (request.nextUrl.pathname.startsWith('/api/admin') && !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Defense-in-depth: deny-by-default on /api/* except an explicit public
  // allowlist. Routes not in this list MUST self-authenticate via getUser().
  // Any route relying on an anonymous caller must be added here on purpose.
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const PUBLIC_API_ALLOWLIST = [
      '/api/auth/',                  // supabase auth callback / oauth
      '/api/webhooks/',              // 3rd-party webhooks (verify signature in-route)
      '/api/cron/',                  // scheduled jobs (verify CRON_SECRET in-route)
      '/api/news/fetch',             // public news feed (read-only)
      '/api/news/live',              // public live ticker (read-only)
      '/api/news/enrich',            // public enrichment (no PII)
      '/api/news/deduplicate',       // dedup helper
      '/api/og/',                    // OpenGraph image generator (public)
      '/api/tags',                   // public tag list
      '/api/newsletter',             // newsletter signup (has its own rate-limit)
      '/api/market-overview',        // public market data
      '/api/auth/google-drive',      // OAuth login initiator
      '/api/auth/callback',          // OAuth callback
      '/api/csp-report',             // CSP violation reporting endpoint (public by spec)
      '/api/empresas/invitations/',  // enterprise invitation preview (validates via RPC lookup_invitation_by_token)
      '/api/empresas/lead',          // enterprise sales lead form (zod-validated, rate-limited in-route)
    ];
    const isPublic = PUBLIC_API_ALLOWLIST.some((p) =>
      request.nextUrl.pathname.startsWith(p)
    );
    if (!isPublic && !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  return supabaseResponse
}
