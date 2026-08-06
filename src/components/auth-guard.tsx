"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { getCleanPathname } from "@/lib/utils";
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";

function skeletonVariantForPath(pathname: string) {
  const p = getCleanPathname(pathname);
  if (p === "/portafolio" || p.startsWith("/portafolio/")) return "portfolio" as const;
  if (p === "/mercados" || p.startsWith("/mercados/")) return "markets" as const;
  if (
    p === "/noticias" ||
    p.startsWith("/noticias/") ||
    p === "/mundo" ||
    p === "/para-ti" ||
    p === "/economia" ||
    p === "/finanzas" ||
    p === "/inversiones" ||
    p === "/tech-global" ||
    p === "/impacto-global" ||
    p === "/breaking"
  )
    return "news" as const;
  if (p === "/flow" || p.startsWith("/flow/")) return "flow" as const;
  if (p === "/" || p === "/ai" || p.startsWith("/ai/")) return "chat" as const;
  return "default" as const;
}

/**
 * Envuelve el contenido de una página protegida.
 *
 * - Mientras la sesión no se ha cargado: muestra skeleton (no pantalla blanca).
 * - Si no hay sesión: abre el popup de registro y no renderiza el contenido.
 * - Si hay sesión: renderiza children.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoaded } = useAuthStore();
  const openModal = useAuthModalStore((s) => s.openModal);
  const pathname = usePathname() || "";

  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      openModal("register");
    }
  }, [isLoaded, isAuthenticated, openModal]);

  if (!isLoaded) {
    return <PageLoadingSkeleton variant={skeletonVariantForPath(pathname)} />;
  }

  if (!isAuthenticated) {
    return <PageLoadingSkeleton variant={skeletonVariantForPath(pathname)} />;
  }

  return <>{children}</>;
}
