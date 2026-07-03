import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { attachReferrerOnSignup } from '@/lib/referrals'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // if "next" is in param, use it as the redirect URL
  const nextParam = searchParams.get('next') ?? '/ai'
  
  // Validate next path to prevent Open Redirect attacks
  // Must start with a single '/' and cannot start with '//' or contain '\'
  const next = (nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.includes('\\'))
    ? nextParam
    : '/ai'

  if (code) {
    const supabase = await createClient()
    const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && authData?.user) {
      // ── Programa de referidos: vincula al referrer si la cookie mav_ref existe ──
      // Idempotente y en try/catch: nunca bloquea el login del usuario.
      try {
        const cookieHeader = request.headers.get('cookie') || ''
        const mavRef = cookieHeader
          .split(';')
          .map(c => c.trim())
          .find(c => c.startsWith('mav_ref='))
          ?.split('=')
          .slice(1)
          .join('=')
        if (mavRef) {
          await attachReferrerOnSignup(authData.user.id, mavRef)
        }
      } catch (refErr) {
        console.error('[Auth callback] Referral attach error:', refErr)
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      // Prevent Host Header Injection: define trusted site URL and validate forwardedHost
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || origin
      const isSafeHost = forwardedHost && (
        forwardedHost === 'localhost:3000' || 
        forwardedHost === 'newsbi-pulse.vercel.app' || 
        forwardedHost === 'maverlang.cl' || 
        forwardedHost === 'maverlang.com' ||
        forwardedHost.endsWith('.maverlang.cl') || 
        forwardedHost.endsWith('.maverlang.com')
      )
      
      const redirectUrl = isLocalEnv
        ? `${origin}${next}`
        : isSafeHost
          ? `https://${forwardedHost}${next}`
          : `${siteUrl}${next}`
          
      return NextResponse.redirect(redirectUrl)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
