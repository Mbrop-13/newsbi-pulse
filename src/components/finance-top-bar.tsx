"use client";

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
 * Barra superior de finanzas (solo escritorio):
 * izquierda = Portafolio / Mercados / Noticias / Mundo
 * derecha = buscador de mercados (excepto en Mundo)
 */
export function FinanceTopBar() {
  const rawPathname = usePathname() || "";
  const pathname = getCleanPathname(rawPathname);
  const language = useLanguageStore((s) => s.language);
  const isMundo = pathname === "/mundo" || pathname.startsWith("/mundo/");

  if (!isFinanceTopBarPath(rawPathname)) return null;

  return (
    <div className="hidden md:block sticky top-0 z-40 w-full liquid-glass-bar">
      <div className="w-full max-w-[1440px] mx-auto h-12 px-4 lg:px-6 flex items-center gap-4">
        {/* Nav pills — izquierda */}
        <nav className="flex items-center gap-1 shrink-0" aria-label="Secciones de finanzas">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={`/${language}${item.href}`}
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-semibold transition-all duration-200",
                  active
                    ? "bg-[#1890FF]/12 text-[#1890FF] shadow-sm ring-1 ring-[#1890FF]/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Buscador — derecha (no en Mundo) */}
        {!isMundo && (
          <div className="flex-1 min-w-0 flex justify-end">
            <div className="w-full max-w-md">
              <MarketSearchBar variant="compact" />
            </div>
          </div>
        )}
        {isMundo && <div className="flex-1" />}
      </div>
    </div>
  );
}
