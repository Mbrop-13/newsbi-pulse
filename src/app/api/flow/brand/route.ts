import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { assertSafeFetchUrl } from "@/lib/url-guard";
import { createServiceClient } from "@/lib/supabase";

export const maxDuration = 60;

const MAX_URLS = 12;
const MAX_PRODUCTS = 20;
const MAX_LOGO_CHARS = Math.floor(1.5 * 1024 * 1024 * 1.4); // ~1.5MB base64
const BRAND_TYPES = new Set([
  "informative",
  "online_store",
  "service",
  "saas",
  "local_business",
  "other",
]);
const LOGO_MODES = new Set([
  "none",
  "bottom_right",
  "top_right",
  "bottom_left",
  "ai_decide",
]);
const PAGE_KINDS = new Set(["catalog", "page"]);

function sanitizeText(v: unknown, max = 2000): string {
  if (typeof v !== "string") return "";
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}

function isValidLogoData(logo: string | null): boolean {
  if (!logo) return true;
  if (logo.length > MAX_LOGO_CHARS) return false;
  return /^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,/i.test(logo);
}

async function validateOptionalUrl(
  raw: string | null | undefined
): Promise<{ ok: true; url: string | null } | { ok: false; reason: string }> {
  const s = sanitizeText(raw, 2000);
  if (!s) return { ok: true, url: null };
  // normalize scheme
  let candidate = s;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  const safe = await assertSafeFetchUrl(candidate);
  if (!safe.ok) return { ok: false, reason: safe.reason };
  return { ok: true, url: safe.url.toString() };
}

async function loadBrandWithItems(userId: string) {
  const service = createServiceClient();
  const { data: brand, error } = await service
    .from("flow_brands")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!brand) return null;

  const { data: items, error: itemsErr } = await service
    .from("flow_brand_items")
    .select("*")
    .eq("brand_id", brand.id)
    .order("sort_order", { ascending: true });

  if (itemsErr) throw itemsErr;

  return { ...brand, items: items || [] };
}

async function buildItemsPayload(
  brandId: string,
  websiteUrl: string | null,
  products: Array<{ name: string; url?: string; description?: string }>,
  pages: Array<{ name: string; url?: string; kind?: string }>
) {
  const items: Array<{
    brand_id: string;
    kind: string;
    name: string;
    url: string | null;
    description: string;
    sort_order: number;
    analysis_status: string;
  }> = [];

  let sort = 0;
  let urlCount = 0;

  if (websiteUrl) {
    urlCount++;
    items.push({
      brand_id: brandId,
      kind: "home",
      name: "Sitio web principal",
      url: websiteUrl,
      description: "",
      sort_order: sort++,
      analysis_status: "pending",
    });
  }

  const safeProducts = (products || []).slice(0, MAX_PRODUCTS);
  for (const p of safeProducts) {
    const name = sanitizeText(p.name, 120) || "Producto";
    const description = sanitizeText(p.description, 1000);
    const urlRes = await validateOptionalUrl(p.url);
    if (!urlRes.ok) {
      throw new Error(`URL de producto inválida (${name}): ${urlRes.reason}`);
    }
    if (urlRes.url) {
      urlCount++;
      if (urlCount > MAX_URLS) {
        throw new Error(`Máximo ${MAX_URLS} URLs en total (web + productos + páginas).`);
      }
    }
    items.push({
      brand_id: brandId,
      kind: "product",
      name,
      url: urlRes.url,
      description,
      sort_order: sort++,
      analysis_status: urlRes.url ? "pending" : "skipped",
    });
  }

  const safePages = (pages || []).slice(0, MAX_URLS);
  for (const page of safePages) {
    const name = sanitizeText(page.name, 120) || "Página";
    const kind = PAGE_KINDS.has(page.kind || "") ? (page.kind as string) : "page";
    const urlRes = await validateOptionalUrl(page.url);
    if (!urlRes.ok) {
      throw new Error(`URL de página inválida (${name}): ${urlRes.reason}`);
    }
    if (!urlRes.url) continue;
    urlCount++;
    if (urlCount > MAX_URLS) {
      throw new Error(`Máximo ${MAX_URLS} URLs en total (web + productos + páginas).`);
    }
    items.push({
      brand_id: brandId,
      kind,
      name,
      url: urlRes.url,
      description: "",
      sort_order: sort++,
      analysis_status: "pending",
    });
  }

  return items;
}

export async function GET() {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    const brand = await loadBrandWithItems(auth.data.user.id);
    return NextResponse.json({ brand });
  } catch (err: unknown) {
    console.error("[flow/brand GET]", err);
    return NextResponse.json(
      { error: "No se pudo cargar la marca." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const userId = auth.data.user.id;
    const service = createServiceClient();

    const existing = await loadBrandWithItems(userId);
    if (existing) {
      return NextResponse.json(
        { error: "Ya tienes una marca configurada. Usa editar para actualizarla." },
        { status: 409 }
      );
    }

    const body = await req.json();
    const name = sanitizeText(body.name, 80) || "Mi marca";
    const brand_type = BRAND_TYPES.has(body.brand_type) ? body.brand_type : "other";
    const description = sanitizeText(body.description, 4000);
    const logo_data =
      typeof body.logo_data === "string" && body.logo_data.length > 0
        ? body.logo_data
        : null;
    const default_logo_mode = LOGO_MODES.has(body.default_logo_mode)
      ? body.default_logo_mode
      : "ai_decide";

    if (!isValidLogoData(logo_data)) {
      return NextResponse.json(
        {
          error:
            "Logo inválido. Usa PNG, JPG, WEBP o SVG de hasta 1.5 MB.",
        },
        { status: 400 }
      );
    }

    const websiteRes = await validateOptionalUrl(body.website_url);
    if (!websiteRes.ok) {
      return NextResponse.json(
        { error: `URL del sitio web inválida: ${websiteRes.reason}` },
        { status: 400 }
      );
    }

    const { data: brand, error } = await service
      .from("flow_brands")
      .insert({
        user_id: userId,
        name,
        brand_type,
        description,
        logo_data,
        website_url: websiteRes.url,
        default_logo_mode,
        analysis_status: "idle",
      })
      .select("*")
      .single();

    if (error || !brand) {
      console.error("[flow/brand POST] insert", error);
      return NextResponse.json(
        { error: "No se pudo crear la marca." },
        { status: 500 }
      );
    }

    let itemsPayload;
    try {
      itemsPayload = await buildItemsPayload(
        brand.id,
        websiteRes.url,
        body.products || [],
        body.pages || []
      );
    } catch (e: unknown) {
      await service.from("flow_brands").delete().eq("id", brand.id);
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Datos inválidos" },
        { status: 400 }
      );
    }

    if (itemsPayload.length > 0) {
      const { error: itemsErr } = await service
        .from("flow_brand_items")
        .insert(itemsPayload);
      if (itemsErr) {
        console.error("[flow/brand POST] items", itemsErr);
        await service.from("flow_brands").delete().eq("id", brand.id);
        return NextResponse.json(
          { error: "No se pudieron guardar los productos/páginas." },
          { status: 500 }
        );
      }
    }

    const full = await loadBrandWithItems(userId);
    return NextResponse.json({ brand: full }, { status: 201 });
  } catch (err: unknown) {
    console.error("[flow/brand POST]", err);
    return NextResponse.json(
      { error: "Error al crear la marca." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const userId = auth.data.user.id;
    const service = createServiceClient();

    const existing = await loadBrandWithItems(userId);
    if (!existing) {
      return NextResponse.json(
        { error: "No hay marca configurada." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const name = sanitizeText(body.name, 80) || existing.name;
    const brand_type = BRAND_TYPES.has(body.brand_type)
      ? body.brand_type
      : existing.brand_type;
    const description =
      body.description !== undefined
        ? sanitizeText(body.description, 4000)
        : existing.description;
    const logo_data =
      body.logo_data === null
        ? null
        : typeof body.logo_data === "string"
          ? body.logo_data
          : existing.logo_data;
    const default_logo_mode = LOGO_MODES.has(body.default_logo_mode)
      ? body.default_logo_mode
      : existing.default_logo_mode;

    if (!isValidLogoData(logo_data)) {
      return NextResponse.json(
        {
          error:
            "Logo inválido. Usa PNG, JPG, WEBP o SVG de hasta 1.5 MB.",
        },
        { status: 400 }
      );
    }

    const websiteRes = await validateOptionalUrl(
      body.website_url !== undefined ? body.website_url : existing.website_url
    );
    if (!websiteRes.ok) {
      return NextResponse.json(
        { error: `URL del sitio web inválida: ${websiteRes.reason}` },
        { status: 400 }
      );
    }

    const { error: updErr } = await service
      .from("flow_brands")
      .update({
        name,
        brand_type,
        description,
        logo_data,
        website_url: websiteRes.url,
        default_logo_mode,
        // Reset analysis when structure changes via full items sync
        analysis_status: "idle",
        analysis_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("user_id", userId);

    if (updErr) {
      console.error("[flow/brand PATCH]", updErr);
      return NextResponse.json(
        { error: "No se pudo actualizar la marca." },
        { status: 500 }
      );
    }

    // Replace items when products/pages provided
    if (body.products !== undefined || body.pages !== undefined) {
      await service.from("flow_brand_items").delete().eq("brand_id", existing.id);

      let itemsPayload;
      try {
        itemsPayload = await buildItemsPayload(
          existing.id,
          websiteRes.url,
          body.products || [],
          body.pages || []
        );
      } catch (e: unknown) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Datos inválidos" },
          { status: 400 }
        );
      }

      if (itemsPayload.length > 0) {
        const { error: itemsErr } = await service
          .from("flow_brand_items")
          .insert(itemsPayload);
        if (itemsErr) {
          console.error("[flow/brand PATCH] items", itemsErr);
          return NextResponse.json(
            { error: "No se pudieron actualizar los productos/páginas." },
            { status: 500 }
          );
        }
      }
    }

    const full = await loadBrandWithItems(userId);
    return NextResponse.json({ brand: full });
  } catch (err: unknown) {
    console.error("[flow/brand PATCH]", err);
    return NextResponse.json(
      { error: "Error al actualizar la marca." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const service = createServiceClient();

    const { error } = await service
      .from("flow_brands")
      .delete()
      .eq("user_id", auth.data.user.id);

    if (error) {
      console.error("[flow/brand DELETE]", error);
      return NextResponse.json(
        { error: "No se pudo eliminar la marca." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[flow/brand DELETE]", err);
    return NextResponse.json(
      { error: "Error al eliminar la marca." },
      { status: 500 }
    );
  }
}
