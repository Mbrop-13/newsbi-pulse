import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import { rateLimit, rateLimitResponse, AUTH_LIMIT } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  // ── Rate-limit OAuth callback (A-14: AUTH_LIMIT, ASVS 11.3.1) ──
  const ip = getClientIp(req);
  const rl = await rateLimit(`oauth-callback:${ip}`, AUTH_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return new Response("No authorization code provided", { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response("No autorizado", { status: 401 });
    }

    const clientId = process.env.DRIVE_CLIENT_ID;
    const clientSecret = process.env.DRIVE_CLIENT_SECRET;
    const redirectUri = `${req.nextUrl.origin}/api/auth/callback/google-drive`;

    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2.getToken(code);
    oauth2.setCredentials(tokens);

    // Fetch email of connected account
    const oauth2Client = google.oauth2({ version: "v2", auth: oauth2 });
    const userInfo = await oauth2Client.userinfo.get();
    const email = userInfo.data.email || null;

    // Persist to Supabase using admin service role key to avoid RLS constraints during connection setup
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null;

    const { error: upsertError } = await supabaseAdmin.from("user_drive_connections").upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token!,
        ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}), // Keep existing refresh token if Google doesn't return a new one on re-auth
        expires_at: expiresAt,
        email,
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      throw upsertError;
    }

    // Return HTML to notify parent window and close popup
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Drive Conectado</title>
        </head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #0F172A; color: white;">
          <h2 style="color: #1890FF;">✔ ¡Google Drive Conectado con Éxito!</h2>
          <p>Esta ventana se cerrará automáticamente en unos segundos.</p>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage("google-drive-connected", "*");
              }
              setTimeout(function() {
                window.close();
              }, 1500);
            } catch (e) {
              console.error(e);
            }
          </script>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: any) {
    // M-9: do NOT reflect err.message into the HTML body (reflected XSS)
    console.error("[Drive OAuth Callback] Error:", err);
    return new Response("Error de autenticación con Google Drive. Intenta de nuevo.", { status: 500 });
  }
}

