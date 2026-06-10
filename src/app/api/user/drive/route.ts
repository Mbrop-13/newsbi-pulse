import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listGoogleDriveFiles, fetchGoogleDriveFileContent } from "@/lib/services/google-drive";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const files = await listGoogleDriveFiles(user.id);
    return NextResponse.json({ success: true, files });
  } catch (err: any) {
    console.error("[Drive API GET] Error:", err);
    return NextResponse.json(
      { error: err.message || String(err), code: "DRIVE_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const fileId = body?.fileId;
    if (!fileId) {
      return NextResponse.json({ error: "Se requiere fileId" }, { status: 400 });
    }

    const fileData = await fetchGoogleDriveFileContent(user.id, fileId);
    return NextResponse.json({ success: true, file: fileData });
  } catch (err: any) {
    console.error("[Drive API POST] Error:", err);
    return NextResponse.json(
      { error: err.message || String(err), code: "DRIVE_ERROR" },
      { status: 500 }
    );
  }
}
