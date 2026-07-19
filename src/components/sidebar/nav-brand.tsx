"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronRight,
  Globe,
  Package,
  LayoutGrid,
  Link2,
  BadgeCheck,
  Pencil,
  Sparkles,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import {
  useBrandStore,
  type ItemKind,
  type BrandItem,
} from "@/lib/stores/brand-store";
import { cn } from "@/lib/utils";
import { UpgradeModal } from "@/components/upgrade-modal";

function KindGlyph({ kind, className }: { kind: ItemKind; className?: string }) {
  switch (kind) {
    case "home":
      return <Globe className={className} />;
    case "product":
      return <Package className={className} />;
    case "catalog":
      return <LayoutGrid className={className} />;
    default:
      return <Link2 className={className} />;
  }
}

function kindAccent(kind: ItemKind) {
  switch (kind) {
    case "home":
      return "text-zinc-800 dark:text-zinc-100 bg-zinc-200/80 dark:bg-zinc-700/60";
    case "product":
      return "text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800";
    case "catalog":
      return "text-zinc-600 dark:text-zinc-300 bg-zinc-100/80 dark:bg-zinc-800/80";
    default:
      return "text-zinc-500 bg-zinc-100 dark:bg-zinc-800/60";
  }
}

export function NavBrand() {
  const [isOpen, setIsOpen] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const { isMobile, setOpenMobile } = useSidebar();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openModal = useAuthModalStore((s) => s.openModal);

  const brand = useBrandStore((s) => s.brand);
  const isLoading = useBrandStore((s) => s.isLoading);
  const hasLoaded = useBrandStore((s) => s.hasLoaded);
  const loadBrand = useBrandStore((s) => s.loadBrand);
  const openForm = useBrandStore((s) => s.openForm);
  const activeItemId = useBrandStore((s) => s.activeItemId);
  const setActiveItemId = useBrandStore((s) => s.setActiveItemId);
  const startAnalysis = useBrandStore((s) => s.startAnalysis);

  useEffect(() => {
    if (isAuthenticated && !hasLoaded) {
      loadBrand();
    }
  }, [isAuthenticated, hasLoaded, loadBrand]);

  const handleNavigate = useCallback(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  const requireAuth = () => {
    if (!isAuthenticated) {
      openModal("register");
      return false;
    }
    return true;
  };

  const onSelectItem = (item: BrandItem) => {
    setActiveItemId(item.id);
    handleNavigate();
    toast.success(`Contexto: ${item.name}`, {
      description: "Las nuevas imágenes usarán este producto/página.",
    });
  };

  const onReanalyze = async () => {
    if (!requireAuth() || !brand) return;
    const withUrl = brand.items.filter((i) => i.url);
    if (withUrl.length === 0) {
      toast.error("Agrega URLs a tu marca para analizarla.");
      openForm();
      return;
    }
    setReanalyzing(true);
    try {
      await startAnalysis();
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code === "TOKEN_LIMIT_REACHED") {
        setShowUpgrade(true);
      } else {
        toast.error(e?.message || "No se pudo re-analizar.");
      }
    } finally {
      setReanalyzing(false);
    }
  };

  return (
    <>
      <SidebarGroup className="pt-0">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <SidebarMenu>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    Marca
                    {brand?.analysis_status === "completed" && (
                      <BadgeCheck className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                    )}
                  </span>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="border-l-0 pl-0 ml-0 mx-0 px-0 space-y-0.5 mt-1">
                  {isLoading && !brand ? (
                    <div className="px-2 py-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Cargando…
                    </div>
                  ) : !brand ? (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        className="w-full cursor-pointer"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (!requireAuth()) return;
                            openForm();
                            handleNavigate();
                          }}
                          className="flex items-center gap-2.5 w-full py-1 text-left"
                        >
                          <div className="w-6 h-6 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shrink-0">
                            <Plus className="h-3.5 w-3.5" />
                          </div>
                          <span className="truncate font-semibold">
                            Configurar marca
                          </span>
                        </button>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ) : (
                    <>
                      {/* Brand header card */}
                      <div className="px-1.5 mb-1.5">
                        <div className="rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-zinc-50/80 dark:bg-zinc-900/40 px-2.5 py-2 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                            {brand.logo_data ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={brand.logo_data}
                                alt=""
                                className="w-full h-full object-contain p-0.5"
                              />
                            ) : (
                              <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                                {brand.name.slice(0, 1).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-100">
                              {brand.name}
                            </p>
                            <p className="text-[10px] text-zinc-500 truncate capitalize">
                              {brand.analysis_status === "analyzing"
                                ? "Analizando…"
                                : brand.analysis_status === "completed"
                                  ? "Lista"
                                  : brand.analysis_status === "failed"
                                    ? "Error en análisis"
                                    : "Sin analizar"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 mt-1.5 px-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (!requireAuth()) return;
                              openForm();
                            }}
                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            Editar
                          </button>
                          <button
                            type="button"
                            disabled={reanalyzing}
                            onClick={onReanalyze}
                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                          >
                            {reanalyzing ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            Analizar
                          </button>
                        </div>
                      </div>

                      {brand.items.map((item) => {
                        const active = activeItemId === item.id;
                        return (
                          <SidebarMenuSubItem key={item.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={active}
                              className="w-full cursor-pointer"
                            >
                              <button
                                type="button"
                                onClick={() => onSelectItem(item)}
                                className="flex items-center gap-2.5 w-full py-1 min-w-0 text-left"
                              >
                                <div
                                  className={cn(
                                    "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                                    kindAccent(item.kind)
                                  )}
                                >
                                  <KindGlyph kind={item.kind} className="h-3.5 w-3.5" />
                                </div>
                                <span className="truncate text-[13px]">
                                  {item.name}
                                </span>
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}

                      {brand.items.length === 0 && (
                        <p className="px-2 py-2 text-[11px] text-muted-foreground">
                          Sin productos ni páginas aún.
                        </p>
                      )}
                    </>
                  )}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </SidebarMenu>
        </Collapsible>
      </SidebarGroup>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="ai_message"
      />
    </>
  );
}
