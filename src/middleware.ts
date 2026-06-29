import { NextResponse, NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // 1. Ignore static files, API routes, auth callback routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname.includes('.')
  ) {
    return await updateSession(request)
  }

  // 2. Check if the URL pathname starts with a language prefix (/es or /en)
  const langMatch = pathname.match(/^\/(es|en)(\/.*)?$/)
  if (langMatch) {
    const lang = langMatch[1]
    const rest = langMatch[2] || '/'

    // Set internal rewrite to the clean path (e.g. /es/ai -> /ai)
    url.pathname = rest
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-next-intl-locale', lang)

    // Create internal rewrite response
    let response = NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      }
    })

    // Sync with Supabase session update (pass rewritten request path)
    const rewrittenRequest = new NextRequest(url, {
      headers: request.headers,
      body: request.body,
      method: request.method,
      signal: request.signal,
    })
    const sessionResponse = await updateSession(rewrittenRequest)

    // Merge headers/cookies from updateSession
    sessionResponse.headers.forEach((value, key) => {
      response.headers.set(key, value)
    })

    // Set the locale cookie
    response.cookies.set('maverlang_locale', lang, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/'
    })
    return response
  }

  // 3. No language prefix: resolve locale (cookie > Accept-Language > 'en')
  //    and REWRITE internally instead of issuing a 307 redirect. This avoids
  //    a full extra round-trip to the server before any HTML is painted, which
  //    is the main perceived-latency cost on the initial load.
  const localeCookie = request.cookies.get('maverlang_locale')?.value
  let locale = localeCookie

  if (!locale || (locale !== 'es' && locale !== 'en')) {
    const acceptLanguage = request.headers.get('accept-language') || ''
    locale = acceptLanguage.toLowerCase().includes('es') ? 'es' : 'en'
  }

  // Rewrite internally to the localized path WITHOUT changing the browser URL.
  // The locale cookie is set so subsequent requests keep the same locale.
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-next-intl-locale', locale)

  const response = NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    }
  })
  response.cookies.set('maverlang_locale', locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/'
  })

  // Still run Supabase session refresh on the rewritten request
  const rewrittenRequest = new NextRequest(url, {
    headers: request.headers,
    body: request.body,
    method: request.method,
    signal: request.signal,
  })
  const sessionResponse = await updateSession(rewrittenRequest)
  sessionResponse.headers.forEach((value, key) => {
    response.headers.set(key, value)
  })
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
