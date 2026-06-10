import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { google } from "googleapis";

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

    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Generate authentication URL requesting read-only access to Drive files and user email
    const authUrl = oauth2.generateAuthUrl({
      access_type: "offline",
      prompt: "consent", // Force consent screen to guarantee refresh token is returned
      scope: [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    });

    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    console.error("[Drive Auth Login] Error:", err);
    return new Response(`Error al iniciar autenticación con Google: ${err.message || String(err)}`, { status: 500 });
  }
}
