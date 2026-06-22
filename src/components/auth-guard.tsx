"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";

/**
 * Envuelve el contenido de una página protegida.
 *
 * - Mientras la sesión no se ha cargado (`!isLoaded`): no renderiza nada para
 *   evitar un flash del contenido protegido antes de saber si hay sesión.
 * - Si no hay sesión: abre el popup de registro (una sola vez) y no renderiza
 *   el contenido. Así, aunque un usuario no autenticado escriba la URL de una
 *   página protegida directamente, no ve los datos: solo aparece el popup.
 * - Si hay sesión: renderiza `children` normalmente.
 *
 * Seguridad: aunque este gate es client-side, los datos sensibles viven tras
 * Supabase RLS (tablas user-scoped filtran por user.id), así que un no-auth no
 * puede leer datos privados aunque bypase el render. Los endpoints de API
 * también validan la sesión server-side.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoaded } = useAuthStore();
  const openModal = useAuthModalStore((s) => s.openModal);

  useEffect(() => {
    // Solo abrir el popup cuando sepamos con certeza que NO hay sesión.
    if (isLoaded && !isAuthenticated) {
      openModal("register");
    }
  }, [isLoaded, isAuthenticated, openModal]);

  if (!isLoaded) return null;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
