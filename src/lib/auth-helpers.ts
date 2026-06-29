import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase";

/**
 * Auth helpers for API routes — enforce ASVS L3 authentication/authorization
 * with a single consistent pattern. All sensitive endpoints should call one of these.
 */

export interface AuthResult {
  user: { id: string; email?: string };
  supabase: Awaited<ReturnType<typeof createClient>>;
}

/** Require an authenticated user. Returns 401 JSON response if missing. */
export async function requireUser(): Promise<
  { ok: true; data: AuthResult } | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No autorizado. Inicia sesión para continuar." },
        { status: 401 }
      ),
    };
  }

  return { ok: true, data: { user: { id: user.id, email: user.email ?? undefined }, supabase } };
}

/** Require an authenticated ADMIN user. Returns 401/403 JSON response otherwise. */
export async function requireAdmin(): Promise<
  { ok: true; data: AuthResult } | { ok: false; response: NextResponse }
> {
  const auth = await requireUser();
  if (!auth.ok) return auth;

  const service = createServiceClient();
  const { data: adminCheck, error } = await service
    .from("admin_users")
    .select("role")
    .eq("user_id", auth.data.user.id)
    .maybeSingle();

  if (error || !adminCheck || adminCheck.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Prohibido. Se requieren privilegios de administrador." },
        { status: 403 }
      ),
    };
  }

  return auth;
}

/** Extract the client IP from common proxy headers. */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
