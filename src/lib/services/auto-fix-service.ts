/**
 * Auto-Fix Service for WebBuilder Preview Errors
 *
 * Intercepts compilation and runtime errors in Sandpack and requests an LLM-powered fix
 * from the dedicated backend endpoint.
 */

export interface AutoFixWarning {
  filePath: string;
  reason: string;
}

export interface AutoFixResult {
  files: Record<string, string>;
  warnings: AutoFixWarning[];
}

export async function attemptAutoFix(
  error: string,
  files: Record<string, { code: string } | string>
): Promise<AutoFixResult | null> {
  try {
    // Flatten files to Record<string, string> if they are of type WebBuilderFile
    const flatFiles = Object.fromEntries(
      Object.entries(files).map(([path, f]) => [
        path,
        typeof f === "object" && f !== null && "code" in f ? f.code : String(f)
      ])
    );

    const response = await fetch("/api/webbuilder-fix", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error,
        files: flatFiles,
      }),
    });

    if (!response.ok) {
      console.error("[Auto-Fix Service] Server returned non-ok status:", response.status);
      return null;
    }

    const data = await response.json();
    if (data.success && data.files) {
      return {
        files: data.files as Record<string, string>,
        warnings: Array.isArray(data.warnings) ? (data.warnings as AutoFixWarning[]) : [],
      };
    } else {
      console.warn("[Auto-Fix Service] Server did not succeed in generating a fix:", data.error || "Unknown error");
      return null;
    }
  } catch (err) {
    console.error("[Auto-Fix Service] Request failed:", err);
    return null;
  }
}
