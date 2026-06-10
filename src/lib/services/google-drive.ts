import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client to query connections securely on server side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getOAuth2Client() {
  const clientId = process.env.DRIVE_CLIENT_ID;
  const clientSecret = process.env.DRIVE_CLIENT_SECRET;
  // Callback endpoint for oauth flow
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback/google-drive`;

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Gets an authenticated Google Drive client for a user.
 * Automatically handles token refresh if expired.
 */
export async function getGoogleDriveClient(userId: string) {
  // 1. Fetch connection from Supabase
  const { data: conn, error } = await supabaseAdmin
    .from("user_drive_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !conn) {
    throw new Error("Google Drive no conectado para este usuario");
  }

  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({
    access_token: conn.access_token,
    refresh_token: conn.refresh_token,
    expiry_date: conn.expires_at ? new Date(conn.expires_at).getTime() : undefined,
  });

  // 2. Check if token needs refresh
  const isExpired = conn.expires_at ? new Date(conn.expires_at).getTime() < Date.now() : true;
  if (isExpired && conn.refresh_token) {
    try {
      const { credentials } = await oauth2.refreshAccessToken();
      
      // Update tokens in DB
      await supabaseAdmin
        .from("user_drive_connections")
        .update({
          access_token: credentials.access_token!,
          expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
          ...(credentials.refresh_token ? { refresh_token: credentials.refresh_token } : {}),
        })
        .eq("user_id", userId);

      oauth2.setCredentials(credentials);
    } catch (err) {
      console.error("[Google Drive Service] Error refreshing access token:", err);
    }
  }

  return google.drive({ version: "v3", auth: oauth2 });
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * Lists user's Google Drive files (filters out folders by default)
 */
export async function listGoogleDriveFiles(
  userId: string,
  limit: number = 30
): Promise<DriveFileItem[]> {
  try {
    const drive = await getGoogleDriveClient(userId);
    const response = await drive.files.list({
      pageSize: limit,
      fields: "files(id, name, mimeType, modifiedTime, webViewLink)",
      q: "trashed = false and mimeType != 'application/vnd.google-apps.folder'",
      orderBy: "modifiedTime desc",
    });

    return (response.data.files || []).map((f) => ({
      id: f.id || "",
      name: f.name || "Sin título",
      mimeType: f.mimeType || "",
      modifiedTime: f.modifiedTime || undefined,
      webViewLink: f.webViewLink || undefined,
    }));
  } catch (err) {
    console.error("[Google Drive Service] List files failed:", err);
    throw err;
  }
}

/**
 * Downloads a file from Google Drive and returns its content as text if readable.
 */
export async function fetchGoogleDriveFileContent(
  userId: string,
  fileId: string
): Promise<{ name: string; content: string; mimeType: string }> {
  try {
    const drive = await getGoogleDriveClient(userId);

    // 1. Get file metadata
    const metadataRes = await drive.files.get({
      fileId,
      fields: "name, mimeType",
    });

    const name = metadataRes.data.name || "archivo_drive";
    const mimeType = metadataRes.data.mimeType || "application/octet-stream";

    let content = "";

    // 2. Handle Google Docs differently (they must be exported)
    if (mimeType === "application/vnd.google-apps.document") {
      const exportRes = await drive.files.export({
        fileId,
        mimeType: "text/plain",
      });
      content = typeof exportRes.data === "string" ? exportRes.data : JSON.stringify(exportRes.data);
    } else {
      // Direct media download for standard files
      const fileRes = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "text" }
      );
      content = typeof fileRes.data === "string" ? fileRes.data : JSON.stringify(fileRes.data);
    }

    return {
      name,
      content: content.slice(0, 30000), // Crop to max 30k chars for prompt budget
      mimeType,
    };
  } catch (err) {
    console.error("[Google Drive Service] Fetch file content failed:", err);
    throw err;
  }
}
