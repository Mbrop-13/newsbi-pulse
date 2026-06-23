import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionPage, refreshSessionFrame } from "@/lib/services/browser-manager";
import { z } from "zod";

const clickSchema = z.object({
  sessionId: z.string(),
  x: z.number(),
  y: z.number(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = clickSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Parámetros inválidos", details: parsed.error.format() }, { status: 400 });
    }

    const { sessionId, x, y } = parsed.data;
    const page = getSessionPage(sessionId);
    
    if (!page) {
      return NextResponse.json({ error: "Sesión del navegador no encontrada o inactiva" }, { status: 404 });
    }

    // Perform mouse click on the remote page
    await page.mouse.click(x, y, { delay: 100 });
    
    // Automatically wait a brief moment for page transitions
    await page.waitForTimeout(500);
    
    // Trigger screenshot refresh
    await refreshSessionFrame(sessionId);

    return NextResponse.json({ success: true, url: page.url() });
  } catch (error: any) {
    console.error("[Browser Click API] Error:", error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
