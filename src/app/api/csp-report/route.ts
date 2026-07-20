import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint de reporting CSP (ASVS 14.x — observabilidad de seguridad).
 *
 * Recibe los POST del navegador cuando se viola la Content-Security-Policy
 * (intentos de XSS, scripts no autorizados, etc.) y los loguea en servidor
 * para que el equipo pueda detectar ataques o bugs.
 *
 * Es público por diseño (el navegador no envía cookies al reportar), pero:
 *  - valida el Content-Type
 *  - limita el tamaño del body (1 KB)
 *  - no refleja el contenido de vuelta (sólo 204)
 */
const MAX_BODY_BYTES = 1024;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json") && !contentType.includes("application/csp-report")) {
      return new NextResponse(null, { status: 204 });
    }

    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      // Report malicioso / malformado gigante: ignorar
      return new NextResponse(null, { status: 204 });
    }

    // Log estructurado: los sistemas de logs (Vercel, Datadog) pueden indexarlo.
    const report = JSON.parse(text);
    const violation = report["csp-report"] || report;
    console.warn("[CSP Violation]", {
      "document-uri": violation["document-uri"],
      "violated-directive": violation["violated-directive"],
      "effective-directive": violation["effective-directive"],
      "blocked-uri": violation["blocked-uri"],
      "source-file": violation["source-file"],
      "line-number": violation["line-number"],
      "script-sample": violation["script-sample"]?.slice(0, 120),
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    // Nunca devolver error al navegador: rompería el reporting.
    return new NextResponse(null, { status: 204 });
  }
}

export function GET() {
  // Health check simple
  return NextResponse.json({ ok: true, endpoint: "csp-report" });
}
