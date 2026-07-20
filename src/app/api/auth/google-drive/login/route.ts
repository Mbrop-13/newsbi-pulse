import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { google } from "googleapis";
import { issueOAuthState, issuePkce } from "@/lib/oauth-state";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response("No autorizado", { status: 401 });
    }

    const clientId = process.env.DRIVE_CLIENT_ID;
    const clientSecret = process.env.DRIVE_CLIENT_SECRET;
    const redirectUri = `${req.nextUrl.origin}/api/auth/callback/google-drive`;

    if (!clientId || !clientSecret) {
      return new Response(
        "Las variables de entorno DRIVE_CLIENT_ID o DRIVE_CLIENT_SECRET no están configuradas en el servidor.",
        { status: 500 }
      );
    }

    // ── NEW-3: CSRF protection (state) + PKCE (code interception protection) ──
    const { state, cookieHeader: stateCookie } = issueOAuthState();
    const { codeChallenge, codeChallengeMethod, cookieHeader: pkceCookie } = issuePkce();

    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Generate authentication URL requesting read-only access to Drive files and user email.
    // state + code_challenge protegen el round-trip OAuth contra CSRF y code interception.
    const authUrl = oauth2.generateAuthUrl({
      access_type: "offline",
      prompt: "consent", // Force consent screen to guarantee refresh token is returned
      state,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
      scope: [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    });

    const res = NextResponse.redirect(authUrl);
    // Ambas cookies: HttpOnly + Secure + SameSite=Lax. Max-Age 10 min cubre el flujo OAuth.
    res.headers.set("Set-Cookie", stateCookie);
    res.headers.append("Set-Cookie", pkceCookie);
    return res;
  } catch (err: any) {
    console.error("[Drive Auth Login] Error:", err);
    // M-9: no reflejar err.message en el body.
    return new Response("Error al iniciar autenticación con Google Drive.", { status: 500 });
  }
}
