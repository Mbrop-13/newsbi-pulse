import { NextRequest, NextResponse } from "next/server";
import { runPythonCode } from "@/lib/services/pyodide-sandbox";
import { requireUser, getClientIp } from "@/lib/auth-helpers";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";
import { assertSafePython } from "@/lib/python-guard";

const MAX_SCRIPT_BYTES = 50_000;
const MAX_PACKAGES = 10;

const runPythonSchema = z.object({
  script: z.string().max(MAX_SCRIPT_BYTES),
  packages: z.array(z.string().max(80)).max(MAX_PACKAGES).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    // Strict per-user rate limit on this expensive/RCE-adjacent endpoint
    const ip = getClientIp(req);
    const rlIp = await rateLimit("runpython-ip:" + ip, {
      maxRequests: 5,
      windowSeconds: 120,
      failClosedInProd: true,
    });
    if (!rlIp.allowed) return rateLimitResponse(rlIp.retryAfterSeconds);
    const rlUser = await rateLimit("runpython:" + auth.data.user.id, {
      maxRequests: 5,
      windowSeconds: 120,
      failClosedInProd: true,
    });
    if (!rlUser.allowed) return rateLimitResponse(rlUser.retryAfterSeconds);

    const body = await req.json();
    const parsed = runPythonSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Formato de solicitud no válido", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { script, packages } = parsed.data;
    const guard = assertSafePython(script, packages);
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: 400 });
    }

    const result = await runPythonCode(script, {}, guard.packages);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Run Python API] Error executing script:", error);
    return NextResponse.json({
      success: false,
      error: "Error de ejecución",  // do NOT leak internal details
      stdout: "",
      stderr: "Execution error",
      durationMs: 0
    }, { status: 500 });
  }
}

