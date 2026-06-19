import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listGoogleDriveFiles, fetchGoogleDriveFileContent } from "@/lib/services/google-drive";
import { z } from "zod";

const driveFileSchema = z.object({
  fileId: z.string().min(1, "fileId is required"),
}).strict();

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

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = driveFileSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ 
        error: "Invalid request payload", 
        details: parseResult.error.format() 
      }, { status: 400 });
    }
    const { fileId } = parseResult.data;

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
