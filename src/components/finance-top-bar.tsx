"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, TrendingUp, Newspaper, Globe } from "lucide-react";
import { cn, getCleanPathname } from "@/lib/utils";
import { useLanguageStore } from "@/lib/stores/language-store";
import { MarketSearchBar } from "@/components/market-search-bar";

const NAV_ITEMS = [
  { id: "portafolio", href: "/portafolio", label: "Portafolio", icon: Briefcase },
  { id: "mercados", href: "/mercados", label: "Mercados", icon: TrendingUp },
  { id: "noticias", href: "/noticias", label: "Noticias", icon: Newspaper },
  { id: "mundo", href: "/mundo", label: "Mundo", icon: Globe },
] as const;

/** Rutas de finanzas donde se muestra la barra superior (PC). */
export function isFinanceTopBarPath(pathname: string): boolean {
  const p = getCleanPathname(pathname);
  return (
    p === "/portafolio" ||
    p.startsWith("/portafolio/") ||
    p === "/mercados" ||
    p.startsWith("/mercados/") ||
    p === "/noticias" ||
    p.startsWith("/noticias/") ||
    p === "/mundo" ||
    p.startsWith("/mundo/") ||
    p === "/para-ti" ||
    p === "/finanzas" ||
    p.startsWith("/finanzas/") ||
    p === "/economia" ||
    p.startsWith("/economia/") ||
    p === "/inversiones" ||
    p.startsWith("/inversiones/") ||
    p === "/tech-global" ||
    p.startsWith("/tech-global/") ||
    p === "/impacto-global" ||
    p.startsWith("/impacto-global/")
  );
}

function isNavActive(pathname: string, href: string): boolean {
  const p = getCleanPathname(pathname);
  if (href === "/noticias") {
    return (
      p === "/noticias" ||
      p.startsWith("/noticias/") ||
      p === "/para-ti" ||
      p === "/finanzas" ||
      p.startsWith("/finanzas/") ||
      p === "/economia" ||
      p.startsWith("/economia/") ||
      p === "/inversiones" ||
      p.startsWith("/inversiones/") ||
      p === "/tech-global" ||
      p.startsWith("/tech-global/") ||
      p === "/impacto-global" ||
      p.startsWith("/impacto-global/")
    );
  }
  return p === href || p.startsWith(href + "/");
}

/**
 * Barra superior PC (portafolio / mercados / noticias / mundo):
 * - Nav izquierda con pestaña activa en negro
 * - Buscador centrado, transparente y expandible al focus
 * - Se oculta al bajar el scroll y reaparece al subir
 */
export function FinanceTopBar() {
  const rawPathname = usePathname() || "";
  const pathname = getCleanPathname(rawPathname);
  const language = useLanguageStore((s) => s.language);
  const isMundo = pathname === "/mundo" || pathname.startsWith("/mundo/");

  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // El scroll real suele estar en <main class="overflow-y-auto">, no en window
    const findScrollParent = (el: HTMLElement | null): HTMLElement | Window => {
      let node: HTMLElement | null = el?.parentElement ?? null;
      while (node) {
        const style = window.getComputedStyle(node);
        const oy = style.overflowY;
        if (oy === "auto" || oy === "scroll" || oy === "overlay") {
          return node;
        }
        node = node.parentElement;
      }
      return window;
    };

    const scrollParent = findScrollParent(root);
    const getY = () =>
      scrollParent === window
        ? window.scrollY || 0
        : (scrollParent as HTMLElement).scrollTop || 0;

    lastScrollY.current = getY();

    const update = () => {
      const y = getY();
      const delta = y - lastScrollY.current;

      setScrolled(y > 16);

      // Mientras el buscador está abierto, la barra no se esconde
      if (searchFocused) {
        setHidden(false);
      } else if (y < 48) {
        setHidden(false);
      } else if (delta > 6) {
        setHidden(true);
      } else if (delta < -6) {
        setHidden(false);
      }

      lastScrollY.current = y;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(update);
      }
    };

    scrollParent.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollParent.removeEventListener("scroll", onScroll);
  }, [searchFocused, pathname]);

  // Al cambiar de ruta, volver a mostrar la barra
  useEffect(() => {
    setHidden(false);
    setScrolled(false);
    lastScrollY.current = 0;
  }, [pathname]);

  if (!isFinanceTopBarPath(rawPathname)) return null;

  return (
    <div
      ref={rootRef}
      className={cn(
        "hidden md:block sticky top-0 z-40 w-full pointer-events-none",
        "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
        hidden && !searchFocused ? "-translate-y-full" : "translate-y-0"
      )}
    >
      <div
        className={cn(
          "w-full transition-[background,border-color,box-shadow,backdrop-filter] duration-300",
          scrolled || searchFocused
            ? "border-b border-black/[0.06] dark:border-white/[0.08] bg-background/55 dark:bg-background/50 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.4)_inset] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="w-full max-w-[1440px] mx-auto h-14 px-4 lg:px-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 pointer-events-auto">
          {/* Nav izquierda */}
          <nav
            className="flex items-center gap-1 justify-self-start min-w-0"
            aria-label="Secciones de finanzas"
          >
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={`/${language}${item.href}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-semibold transition-all duration-200",
                    active
                      ? "bg-black text-white shadow-sm dark:bg-white dark:text-black"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Buscador centrado (no en Mundo) */}
          {!isMundo ? (
            <div
              className={cn(
                "justify-self-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                searchFocused ? "w-[min(52vw,520px)]" : "w-[min(36vw,340px)]"
              )}
            >
              <MarketSearchBar
                variant="compact"
                transparent
                expanded={searchFocused}
                onFocusChange={setSearchFocused}
              />
            </div>
          ) : (
            <div />
          )}

          {/* Columna derecha: equilibra el grid para centrar el buscador */}
          <div className="justify-self-end min-w-0" aria-hidden />
        </div>
      </div>
    </div>
  );
}
