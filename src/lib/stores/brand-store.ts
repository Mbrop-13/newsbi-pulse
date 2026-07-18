import { create } from "zustand";

// ── Types ────────────────────────────────────────────────────────────────────

export type BrandType =
  | "informative"
  | "online_store"
  | "service"
  | "saas"
  | "local_business"
  | "other";

export type LogoMode =
  | "none"
  | "bottom_right"
  | "top_right"
  | "bottom_left"
  | "ai_decide";

export type BrandAnalysisStatus = "idle" | "analyzing" | "completed" | "failed";
export type ItemKind = "home" | "catalog" | "product" | "page";
export type ItemAnalysisStatus = "pending" | "running" | "done" | "failed" | "skipped";

export interface BrandItem {
  id: string;
  brand_id: string;
  kind: ItemKind;
  name: string;
  url: string | null;
  description: string;
  image_url: string | null;
  analysis_status: ItemAnalysisStatus;
  analysis: Record<string, unknown>;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface FlowBrand {
  id: string;
  user_id: string;
  name: string;
  brand_type: BrandType;
  description: string;
  logo_data: string | null;
  website_url: string | null;
  default_logo_mode: LogoMode;
  ai_profile: Record<string, unknown>;
  analysis_status: BrandAnalysisStatus;
  analysis_error: string | null;
  created_at?: string;
  updated_at?: string;
  items: BrandItem[];
}

export interface AgentProgress {
  itemId: string;
  name: string;
  kind: ItemKind;
  status: "pending" | "running" | "done" | "failed";
  summary?: string;
  error?: string;
}

export interface BrandFormProduct {
  /** temp client id for list keys */
  clientId: string;
  name: string;
  url: string;
  description: string;
}

export interface BrandFormPage {
  clientId: string;
  name: string;
  url: string;
  kind: "catalog" | "page";
}

export const BRAND_TYPE_OPTIONS: { id: BrandType; label: string; desc: string }[] = [
  { id: "informative", label: "Sitio informativo", desc: "Blog, corporate, contenido" },
  { id: "online_store", label: "Tienda online", desc: "E-commerce y catálogo" },
  { id: "service", label: "Servicio", desc: "Agencia, consultoría, freelance" },
  { id: "saas", label: "SaaS / App", desc: "Producto digital o software" },
  { id: "local_business", label: "Negocio local", desc: "Restaurante, clínica, retail" },
  { id: "other", label: "Otro", desc: "Marca personal u otro formato" },
];

export const LOGO_MODE_OPTIONS: { id: LogoMode; label: string }[] = [
  { id: "none", label: "Sin logo" },
  { id: "bottom_right", label: "Esquina inferior derecha" },
  { id: "top_right", label: "Esquina superior derecha" },
  { id: "bottom_left", label: "Esquina inferior izquierda" },
  { id: "ai_decide", label: "Que la IA decida" },
];

export const MAX_BRAND_URLS = 12;
export const MAX_BRAND_PRODUCTS = 20;
export const MAX_LOGO_BYTES = 1.5 * 1024 * 1024;

// ── Store ────────────────────────────────────────────────────────────────────

interface BrandStore {
  brand: FlowBrand | null;
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;

  // UI
  isFormOpen: boolean;
  isAnalysisOpen: boolean;
  agentProgress: AgentProgress[];
  analysisComplete: boolean;

  // Generation context
  activeItemId: string | null;
  logoMode: LogoMode;

  // Actions
  openForm: () => void;
  closeForm: () => void;
  openAnalysis: () => void;
  closeAnalysis: () => void;
  setActiveItemId: (id: string | null) => void;
  setLogoMode: (mode: LogoMode) => void;
  setAgentProgress: (agents: AgentProgress[]) => void;
  updateAgentProgress: (itemId: string, patch: Partial<AgentProgress>) => void;
  setAnalysisComplete: (v: boolean) => void;

  loadBrand: () => Promise<void>;
  setBrand: (brand: FlowBrand | null) => void;
  clearBrand: () => void;

  saveBrand: (payload: {
    name: string;
    brand_type: BrandType;
    description: string;
    logo_data: string | null;
    website_url: string;
    default_logo_mode: LogoMode;
    products: BrandFormProduct[];
    pages: BrandFormPage[];
  }) => Promise<FlowBrand | null>;

  deleteBrand: () => Promise<boolean>;
  startAnalysis: () => Promise<boolean>;
  buildGenerationContext: () => {
    brandName: string;
    brandType: string;
    description: string;
    logoMode: LogoMode;
    hasLogo: boolean;
    productName?: string;
    productDescription?: string;
    productUrl?: string;
    aiProfile?: Record<string, unknown>;
    itemAnalysis?: Record<string, unknown>;
  } | null;
}

type RawBrandItem = {
  id?: string;
  brand_id?: string;
  kind?: ItemKind;
  name?: string;
  url?: string | null;
  description?: string;
  image_url?: string | null;
  analysis_status?: ItemAnalysisStatus;
  analysis?: Record<string, unknown>;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
};

type RawBrand = {
  id?: string;
  user_id?: string;
  name?: string;
  brand_type?: BrandType;
  description?: string;
  logo_data?: string | null;
  website_url?: string | null;
  default_logo_mode?: LogoMode;
  ai_profile?: Record<string, unknown>;
  analysis_status?: BrandAnalysisStatus;
  analysis_error?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: RawBrandItem[];
};

function mapBrand(raw: RawBrand): FlowBrand {
  return {
    id: raw.id || "",
    user_id: raw.user_id || "",
    name: raw.name || "Mi marca",
    brand_type: raw.brand_type || "other",
    description: raw.description || "",
    logo_data: raw.logo_data || null,
    website_url: raw.website_url || null,
    default_logo_mode: raw.default_logo_mode || "ai_decide",
    ai_profile: raw.ai_profile || {},
    analysis_status: raw.analysis_status || "idle",
    analysis_error: raw.analysis_error || null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    items: Array.isArray(raw.items)
      ? raw.items
          .map((it) => ({
            id: it.id || "",
            brand_id: it.brand_id || "",
            kind: it.kind || "page",
            name: it.name || "Sin nombre",
            url: it.url || null,
            description: it.description || "",
            image_url: it.image_url || null,
            analysis_status: it.analysis_status || "pending",
            analysis: it.analysis || {},
            sort_order: it.sort_order ?? 0,
            created_at: it.created_at,
            updated_at: it.updated_at,
          }))
          .sort((a: BrandItem, b: BrandItem) => a.sort_order - b.sort_order)
      : [],
  };
}

export const useBrandStore = create<BrandStore>((set, get) => ({
  brand: null,
  isLoading: false,
  hasLoaded: false,
  error: null,

  isFormOpen: false,
  isAnalysisOpen: false,
  agentProgress: [],
  analysisComplete: false,

  activeItemId: null,
  logoMode: "ai_decide",

  openForm: () => set({ isFormOpen: true }),
  closeForm: () => set({ isFormOpen: false }),
  openAnalysis: () => set({ isAnalysisOpen: true, analysisComplete: false }),
  closeAnalysis: () => set({ isAnalysisOpen: false }),
  setActiveItemId: (id) => set({ activeItemId: id }),
  setLogoMode: (mode) => set({ logoMode: mode }),
  setAgentProgress: (agents) => set({ agentProgress: agents }),
  updateAgentProgress: (itemId, patch) =>
    set((s) => ({
      agentProgress: s.agentProgress.map((a) =>
        a.itemId === itemId ? { ...a, ...patch } : a
      ),
    })),
  setAnalysisComplete: (v) => set({ analysisComplete: v }),

  setBrand: (brand) => {
    set({
      brand,
      logoMode: brand?.default_logo_mode || "ai_decide",
      activeItemId: brand?.items?.[0]?.id ?? null,
    });
  },

  clearBrand: () =>
    set({
      brand: null,
      activeItemId: null,
      agentProgress: [],
      analysisComplete: false,
    }),

  loadBrand: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/flow/brand", { method: "GET" });
      if (res.status === 401) {
        set({ brand: null, hasLoaded: true, isLoading: false });
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo cargar la marca");
      }
      const data = await res.json();
      const brand = data.brand ? mapBrand(data.brand) : null;
      set({
        brand,
        hasLoaded: true,
        isLoading: false,
        logoMode: brand?.default_logo_mode || get().logoMode,
        activeItemId:
          get().activeItemId && brand?.items.some((i) => i.id === get().activeItemId)
            ? get().activeItemId
            : brand?.items?.[0]?.id ?? null,
      });
    } catch (err: unknown) {
      console.error("[brand-store] loadBrand:", err);
      set({
        error: err instanceof Error ? err.message : "Error al cargar la marca",
        hasLoaded: true,
        isLoading: false,
      });
    }
  },

  saveBrand: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const existing = get().brand;
      const method = existing ? "PATCH" : "POST";
      const res = await fetch("/api/flow/brand", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          brand_type: payload.brand_type,
          description: payload.description,
          logo_data: payload.logo_data,
          website_url: payload.website_url || null,
          default_logo_mode: payload.default_logo_mode,
          products: payload.products.map((p) => ({
            name: p.name,
            url: p.url,
            description: p.description,
          })),
          pages: payload.pages.map((p) => ({
            name: p.name,
            url: p.url,
            kind: p.kind,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar la marca");
      }

      const brand = mapBrand(data.brand);
      set({
        brand,
        isLoading: false,
        hasLoaded: true,
        logoMode: brand.default_logo_mode,
        activeItemId: brand.items?.[0]?.id ?? null,
      });
      return brand;
    } catch (err: unknown) {
      console.error("[brand-store] saveBrand:", err);
      set({
        error: err instanceof Error ? err.message : "Error al guardar",
        isLoading: false,
      });
      return null;
    }
  },

  deleteBrand: async () => {
    try {
      const res = await fetch("/api/flow/brand", { method: "DELETE" });
      if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo eliminar la marca");
      }
      get().clearBrand();
      return true;
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Error al eliminar" });
      return false;
    }
  },

  startAnalysis: async () => {
    const brand = get().brand;
    if (!brand) return false;

    const withUrl = brand.items.filter((i) => i.url && i.url.trim());
    if (withUrl.length === 0) return false;

    set({
      isAnalysisOpen: true,
      analysisComplete: false,
      agentProgress: withUrl.map((i) => ({
        itemId: i.id,
        name: i.name,
        kind: i.kind,
        status: "pending" as const,
      })),
    });

    // Mark brand analyzing locally
    set({
      brand: { ...brand, analysis_status: "analyzing", analysis_error: null },
    });

    try {
      const res = await fetch("/api/flow/brand/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: brand.id }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
          upgradeRequired?: string;
        };
        if (res.status === 403 && data.code === "TOKEN_LIMIT_REACHED") {
          throw Object.assign(new Error(data.error || "Límite de tokens"), {
            code: "TOKEN_LIMIT_REACHED",
            upgradeRequired: data.upgradeRequired,
          });
        }
        throw new Error(data.error || "No se pudo iniciar el análisis");
      }

      if (!res.body) throw new Error("Respuesta sin stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      type SseEvent = {
        type: string;
        itemId?: string;
        name?: string;
        kind?: ItemKind;
        summary?: string;
        analysis?: Record<string, unknown>;
        error?: string;
        ai_profile?: Record<string, unknown>;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part
            .split("\n")
            .find((l) => l.startsWith("data: "));
          if (!line) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;

          let event: SseEvent;
          try {
            event = JSON.parse(raw) as SseEvent;
          } catch {
            continue;
          }

          if (event.type === "agent_start" && event.itemId) {
            get().updateAgentProgress(event.itemId, {
              status: "running",
              name: event.name,
              kind: event.kind,
            });
          } else if (event.type === "agent_done" && event.itemId) {
            get().updateAgentProgress(event.itemId, {
              status: "done",
              summary: event.summary,
            });
            const b = get().brand;
            if (b) {
              set({
                brand: {
                  ...b,
                  items: b.items.map((it) =>
                    it.id === event.itemId
                      ? {
                          ...it,
                          analysis_status: "done",
                          analysis: event.analysis || it.analysis,
                          name: event.name || it.name,
                        }
                      : it
                  ),
                },
              });
            }
          } else if (event.type === "agent_fail" && event.itemId) {
            get().updateAgentProgress(event.itemId, {
              status: "failed",
              error: event.error,
            });
          } else if (event.type === "profile") {
            const b = get().brand;
            if (b) {
              set({
                brand: {
                  ...b,
                  ai_profile: event.ai_profile || {},
                  analysis_status: "completed",
                },
              });
            }
          } else if (event.type === "complete") {
            set({ analysisComplete: true });
            await get().loadBrand();
            set({ analysisComplete: true, isAnalysisOpen: true });
          } else if (event.type === "error") {
            throw new Error(event.error || "Error en el análisis");
          }
        }
      }

      set({ analysisComplete: true });
      return true;
    } catch (err: unknown) {
      console.error("[brand-store] startAnalysis:", err);
      const message = err instanceof Error ? err.message : "Error en el análisis";
      const b = get().brand;
      if (b) {
        set({
          brand: {
            ...b,
            analysis_status: "failed",
            analysis_error: message,
          },
          error: message,
        });
      }
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code?: string }).code === "TOKEN_LIMIT_REACHED"
      ) {
        throw err;
      }
      return false;
    }
  },

  buildGenerationContext: () => {
    const { brand, activeItemId, logoMode } = get();
    if (!brand) return null;
    const item = brand.items.find((i) => i.id === activeItemId) || null;
    return {
      brandName: brand.name,
      brandType: brand.brand_type,
      description: brand.description,
      logoMode,
      hasLogo: Boolean(brand.logo_data),
      productName: item?.name,
      productDescription: item?.description,
      productUrl: item?.url || undefined,
      aiProfile: brand.ai_profile,
      itemAnalysis: item?.analysis,
    };
  },
}));
