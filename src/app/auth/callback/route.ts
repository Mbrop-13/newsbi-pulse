import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

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
      const response = isLocalEnv
        ? NextResponse.redirect(`${origin}${next}`)
        : forwardedHost
          ? NextResponse.redirect(`https://${forwardedHost}${next}`)
          : NextResponse.redirect(`${origin}${next}`);
          
      // Delete the referral cookie
      response.cookies.delete('reclu_ref_code');
      return response;
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
