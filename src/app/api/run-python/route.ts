import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runPythonCode } from "@/lib/services/pyodide-sandbox";
import { requireUser, getClientIp } from "@/lib/auth-helpers";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

// Hardening (ASVS 5.5.1 / 12.3.1)
const MAX_SCRIPT_BYTES = 50_000;     // ~50KB cap
const MAX_PACKAGES = 10;
// Packages known to enable sandbox escape (network / fs / shell / subprocess)
const FORBIDDEN_PACKAGES = new Set([
  "micropip", "urllib3", "requests", "httpx", "aiohttp", "socket",
  "subprocess", "ctypes", "pty", "shutil", "os", "sys",
]);
// Allowlist of vetted packages for the WebBuilder/sandbox use-case
const PACKAGE_ALLOWLIST = new Set([
  "numpy", "pandas", "matplotlib", "scipy", "sympy", "statistics",
  "math", "datetime", "json", "re", "random", "collections", "itertools",
]);

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
    const rlIp = await rateLimit("runpython-ip:" + ip, { maxRequests: 5, windowSeconds: 120 });
    if (!rlIp.allowed) return rateLimitResponse(rlIp.retryAfterSeconds);
    const rlUser = await rateLimit("runpython:" + auth.data.user.id, { maxRequests: 5, windowSeconds: 120 });
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

    // Validate packages: forbid network/shell-escape, allowlist-only
    for (const pkg of packages) {
      // Normalizar: minúsculas, sin extras [extra], sin versionado, sin espacios
      const name = pkg
        .replace(/\[.*\]/g, "")        // quitar extras: pkg[extra] → pkg
        .split(/[<>=!~;, ]/)[0]         // quitar versión/especificadores
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "");  // descartar cualquier otra cosa
      if (!name) {
        return NextResponse.json({ error: "Nombre de paquete inválido." }, { status: 400 });
      }
      if (FORBIDDEN_PACKAGES.has(name)) {
        return NextResponse.json(
          { error: `Paquete no permitido: ${name}` },
          { status: 400 }
        );
      }
      if (!PACKAGE_ALLOWLIST.has(name)) {
        return NextResponse.json(
          { error: `Paquete no autorizado: ${name}. Solicítalo al equipo.` },
          { status: 400 }
        );
      }
    }

    // Sanity: reject scripts containing obvious escape primitives.
    // Defensa en profundidad — el hardening real está en el sandbox (builtins deshabilitados).
    const ESCAPE_PATTERNS = [
      /\bimport\s+os\b/, /\bimport\s+subprocess\b/, /\bimport\s+socket\b/,
      /\bimport\s+ctypes\b/, /\bimport\s+pty\b/, /\bimport\s+shutil\b/,
      /__import__/, /\beval\s*\(/, /\bexec\s*\(/,
      /\bos\.system\b/, /\bpty\./, /\bctypes\./, /\bsocket\./,
      /\b__builtins__\b/, /\bgetattr\s*\(\s*__builtins__/,
      /\bglobals\s*\(\s*\)\s*\[/, /\bcompile\s*\(/, /\bopen\s*\(\s*['"][a-zA-Z]:/, // open(C:...) fs
    ];
    if (ESCAPE_PATTERNS.some((re) => re.test(script))) {
      return NextResponse.json(
        { error: "El script contiene operaciones no permitidas." },
        { status: 400 }
      );
    }

    // Execute Python script in WebAssembly sandbox
    const result = await runPythonCode(script, {}, packages);

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

