import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      // Process Referral Code
      const cookieStore = request.headers.get('cookie') || '';
      const match = cookieStore.match(/reclu_ref_code=([^;]+)/);
      if (match) {
        const refCode = match[1];
        
        // Find referrer
        const { data: codeData } = await supabase
          .from('referral_codes')
          .select('user_id')
          .eq('code', refCode)
          .single();
          
        if (codeData && codeData.user_id !== authData.user.id) {
          // Attempt to insert referral (ignores if already referred due to unique constraint)
          await supabase.from('referrals').insert({
            referrer_id: codeData.user_id,
            referred_id: authData.user.id
          });
        }
      }
      const forwardedHost = request.headers.get('x-forwarded-host') 
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      // Prevent Host Header Injection: define trusted site URL and validate forwardedHost
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || origin
      const isSafeHost = forwardedHost && (
        forwardedHost === 'localhost:3000' || 
        forwardedHost === 'newsbi-pulse.vercel.app' || 
        forwardedHost === 'reclu.cl' || 
        forwardedHost === 'reclu.com' ||
        forwardedHost.endsWith('.reclu.cl') || 
        forwardedHost.endsWith('.reclu.com')
      )
      
      const redirectUrl = isLocalEnv
        ? `${origin}${next}`
        : isSafeHost
          ? `https://${forwardedHost}${next}`
          : `${siteUrl}${next}`
          
      const response = NextResponse.redirect(redirectUrl)
          
      // Delete the referral cookie
      response.cookies.delete('reclu_ref_code');
      return response;
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
