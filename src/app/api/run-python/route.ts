import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runPythonCode } from "@/lib/services/pyodide-sandbox";
import { z } from "zod";

const runPythonSchema = z.object({
  script: z.string(),
  packages: z.array(z.string()).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado. Inicie sesión para ejecutar scripts." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = runPythonSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Formato de solicitud no válido", details: parsed.error.format() }, { status: 400 });
    }

    const { script, packages } = parsed.data;
    
    // Execute Python script in WebAssembly sandbox
    const result = await runPythonCode(script, {}, packages);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Run Python API] Error executing script:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error),
      stdout: "",
      stderr: error.message || String(error),
      durationMs: 0 
    }, { status: 500 });
  }
}
