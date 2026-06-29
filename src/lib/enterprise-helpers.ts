/**
 * Helpers de autorización para rutas de empresa.
 * Verifican membresía organizacional + rol (owner/admin/member).
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import type { OrgRole } from "@/lib/plan-limits";
import type { Organization, OrganizationMember, OrganizationSubscription } from "@/lib/types";

const service = createServiceClient();

export interface OrgAuthResult {
  userId: string;
  userEmail?: string;
  org: Organization;
  member: OrganizationMember;
  role: OrgRole;
}

export interface OrgAuthOk {
  ok: true;
  data: OrgAuthResult;
}
export interface OrgAuthErr {
  ok: false;
  response: NextResponse;
}

/**
 * Verifica que el usuario es miembro activo de la org indicada,
 * con al menos uno de los roles requeridos.
 */
export async function requireOrgMember(
  orgId: string,
  userId: string,
  userEmail: string | undefined,
  requiredRoles: OrgRole[] = ["owner", "admin", "member"]
): Promise<OrgAuthOk | OrgAuthErr> {
  try {
    // 1. Existe la org?
    const { data: org, error: orgErr } = await service
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .maybeSingle();

    if (orgErr || !org) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Organización no encontrada" }, { status: 404 }),
      };
    }

    // 2. Es miembro activo?
    const { data: member, error: mErr } = await service
      .from("organization_members")
      .select("*")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (mErr || !member) {
      return {
        ok: false,
        response: NextResponse.json({ error: "No eres miembro de esta organización" }, { status: 403 }),
      };
    }

    if (!requiredRoles.includes(member.role as OrgRole)) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 }),
      };
    }

    return {
      ok: true,
      data: {
        userId,
        userEmail,
        org: org as Organization,
        member: member as OrganizationMember,
        role: member.role as OrgRole,
      },
    };
  } catch (err) {
    console.error("[requireOrgMember] Error:", err);
    return {
      ok: false,
      response: NextResponse.json({ error: "Error de autorización" }, { status: 500 }),
    };
  }
}

/**
 * Genera un token criptográfico para invitaciones
 */
export function generateInvitationToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Genera un slug URL-safe a partir de un nombre
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/**
 * Asegura que el slug sea único añadiendo sufijo si existe
 */
export async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await service
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
    slug = `${baseSlug}-${suffix++}`;
  }
}

/**
 * Obtiene la suscripción de una org
 */
export async function getOrgSubscription(
  orgId: string
): Promise<OrganizationSubscription | null> {
  const { data } = await service
    .from("organization_subscriptions")
    .select("*")
    .eq("organization_id", orgId)
    .maybeSingle();
  return (data as OrganizationSubscription) ?? null;
}
