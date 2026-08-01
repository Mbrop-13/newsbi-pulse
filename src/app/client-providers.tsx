"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/footer";
import { FinanceTopBar, isFinanceTopBarPath } from "@/components/finance-top-bar";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegistration } from "@/components/sw-register";
import { PersonalizationApplier } from "@/components/personalization-applier";
import { useAudioPlayerStore } from "@/lib/stores/audio-player-store";
import { AuthToast } from "@/components/auth-toast";
import { ReadingListWidget } from "@/components/reading-list-widget";
import { CapacitorInit } from "@/components/capacitor-init";
import { AuthSync } from "@/components/auth-sync";
import { ReferralAttribution } from "@/components/referral-attribution";
import { PremiumConversionModal } from "@/components/premium-conversion-modal";
import { AuthModals } from "@/components/auth-modals";
import { useAuthModalStore } from "@/lib/stores/auth-store";
import { Toaster } from "sonner";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ActiveArticleDrawer } from "@/components/active-article-drawer";
import { ViewSettingsDialog } from "@/components/view-settings-dialog";
import { ReferralsDialog } from "@/components/referrals/referrals-dialog";
import { OnboardingDialog } from "@/components/onboarding-dialog";
import { useAssistantStore } from "@/lib/stores/assistant-store";

import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { useBrowserStore } from "@/lib/stores/browser-store";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useViewStore } from "@/lib/stores/use-view-store";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useLanguageStore } from "@/lib/stores/language-store";
import { getCleanPathname } from "@/lib/utils";

import { useState, useEffect } from "react";

/**
 * Botón hamburguesa flotante (móvil): círculo con 3 líneas en la esquina
 * superior izquierda. Abre la barra lateral para cambiar de sección.
 * Reemplaza la barra de navegación inferior en finanzas y resto de páginas con sidebar.
 */
function MobileMenuButton() {
  const { setOpenMobile } = useSidebar();
  return (
    <button
      type="button"
      onClick={() => setOpenMobile(true)}
      aria-label="Abrir menú de navegación"
      className={cn(
        "fixed z-50 md:hidden",
        "top-[max(0.875rem,env(safe-area-inset-top))] left-[max(0.875rem,env(safe-area-inset-left))]",
        "flex h-11 w-11 items-center justify-center rounded-full",
        "border border-border/50 bg-background/90 text-foreground",
        "shadow-lg shadow-black/15 dark:shadow-black/40",
        "backdrop-blur-xl",
        "active:scale-95 hover:bg-background hover:border-border",
        "transition-all duration-200 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1890FF]/50"
      )}
    >
      <Menu className="h-5 w-5" strokeWidth={2.25} />
    </button>
  );
}

export function ClientLayoutProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen: authModalOpen, view: authModalView, closeModal } = useAuthModalStore();
  const showSettings = useAssistantStore((s) => s.showSettings);
  const setShowSettings = useAssistantStore((s) => s.setShowSettings);
  const settingsTab = useAssistantStore((s) => s.settingsTab);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && window.self !== window.top) {
      setIsInIframe(true);
      window.parent.postMessage({
        type: "MAVERLANG_IFRAME_BLOCKED_NAVIGATION",
        url: window.location.href
      }, "*");
    }
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const rawPathname = usePathname();
  const pathname = getCleanPathname(rawPathname);



  // Sync URL language prefix with Zustand language store
  useEffect(() => {
    if (rawPathname) {
      const match = rawPathname.match(/^\/(es|en)(\/|$)/);
      if (match) {
        const urlLang = match[1] as "es" | "en";
        const { language, setLanguage } = useLanguageStore.getState();
        if (language !== urlLang) {
          setLanguage(urlLang);
        }
      }
    }
  }, [rawPathname]);
  // La landing de marketing ahora vive en /home (ahí sí van footer + bottom nav).
  // "/" es el chat, que al igual que /ai no muestra footer ni bottom nav.
  const isLandingPage = pathname === "/home" ||
    pathname === "/empresas" ||
    pathname.startsWith("/empresas/") ||
    pathname.startsWith("/invitar/");
  // Pages that use the sidebar layout (no navbar/footer)
  const sidebarPages = [
    "/",
    "/ai",
    "/proyectos",
    "/noticias",
    "/mercados",
    "/portafolio",
    "/mundo",
    "/configuracion",
    "/economia",
    "/finanzas",
    "/inversiones",
    "/tech-global",
    "/impacto-global",
    "/suscripcion",
    "/profile",
    "/referidos",
    "/guardados",
    "/lista-lectura",
    "/para-ti",
    "/nuevo",
    "/breaking",
    "/flow"
  ];
  const isStaticSidebar = sidebarPages.some(p => pathname === p || pathname.startsWith(p + "/"));
  const isArticlePage = pathname.startsWith("/article/");
  const countrySlugs = ["chile", "argentina", "colombia", "brasil", "ecuador", "mexico"];
  const isCountryPage = countrySlugs.some(slug => pathname === `/${slug}` || pathname.startsWith(`/${slug}/`));
  const isSidebarRoute = isStaticSidebar || isArticlePage || isCountryPage;
  const { isAuthenticated, isLoaded: authLoaded, user } = useAuthStore();
  const loadFromSupabase = useAssistantStore((s) => s.loadFromSupabase);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadFromSupabase(user.id);
    }
  }, [isAuthenticated, user?.id, loadFromSupabase]);
  // El sidebar se muestra en rutas con sidebar. Para "/" y "/ai" (el chat de inicio)
  // lo mostramos SIEMPRE, incluso sin auth: así un visitante ve la plataforma
  // completa y al intentar navegar a una página protegida aparece el popup de
  // registro (gate en nav-main.tsx + AuthGuard en cada página). El resto de
  // rutas con sidebar sí requieren auth (sus páginas tienen AuthGuard).
  const isSidebarPage = (isSidebarRoute || pathname === "/" || pathname === "/ai" || pathname.startsWith("/ai/") || pathname === "/flow" || pathname.startsWith("/flow/")) && mounted && (pathname === "/" || pathname === "/ai" || pathname.startsWith("/ai/") || pathname === "/flow" || pathname.startsWith("/flow/") || !authLoaded || isAuthenticated);
  const isFullscreenPage = isSidebarPage;
  const isAiPage = pathname === "/ai" || pathname.startsWith("/ai/") || pathname === "/" || pathname === "" || pathname === "/flow" || pathname.startsWith("/flow/");
  const isAdminPage = pathname.startsWith("/admin");
  const isSharePage = pathname.startsWith("/share");
  const audioMode = useAudioPlayerStore((s) => s.mode);
  const pinnedWidth = useAudioPlayerStore((s) => s.pinnedWidth);

  const messages = useAIChatStore((s) => s.messages);
  const hasMessages = messages.length > 0;
  
  const isWebBuilderMode = useWebBuilderStore((s) => s.isWebBuilderMode);
  const showBuilderWorkspace = isWebBuilderMode && hasMessages;
  const isBrowserOpen = useBrowserStore((s) => s.isOpen);
  const isCanvasOpen = useCanvasStore((s) => s.isOpen);
  const isFixedLayout = showBuilderWorkspace || isBrowserOpen || isCanvasOpen;

  // Aplicar tamaño de fuente + esquema sepia globalmente (accesibilidad visual)
  const fontSize = useViewStore((s) => s.fontSize);
  const colorScheme = useViewStore((s) => s.colorScheme);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    // Tamaño de fuente
    root.classList.remove("font-size-sm", "font-size-base", "font-size-lg");
    root.classList.add(`font-size-${fontSize}`);
    // Sepia
    if (colorScheme === "sepia") {
      root.classList.add("sepia");
    } else {
      root.classList.remove("sepia");
    }
  }, [fontSize, colorScheme]);

  if (isInIframe) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex flex-col items-center justify-center p-4 text-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3" />
        <p className="text-xs text-zinc-400">Restaurando vista previa...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <TooltipProvider>
          <AuthSync />
          <ReferralAttribution />
        <div className="flex flex-col h-[100dvh] overflow-hidden relative">
          {/* Top Navbar removed as requested to unify layout */}
          <main
            className={cn(
              "flex-1 transition-all duration-300 ease-in-out",
              (isFixedLayout || isAiPage) ? "overflow-hidden h-full" : "overflow-y-auto h-full"
            )}
            style={{
              ...((!isAdminPage && audioMode === "pinned") ? { marginRight: pinnedWidth } : {}),
              transition: 'margin-right 0.3s ease-in-out',
            }}
          >
            {isSidebarPage ? (
              <SidebarProvider>
                {pathname !== "/suscripcion" && pathname !== "/referidos" && <AppSidebar />}
                <SidebarInset className={cn((isFixedLayout || isAiPage) && "h-[100dvh] overflow-hidden bg-background")}>
                  {isMobile && !isFixedLayout && pathname !== "/suscripcion" && pathname !== "/referidos" && <MobileMenuButton />}
                  <div className={cn(
                    (isFixedLayout || isAiPage)
                      ? "flex flex-col h-[100dvh] w-full min-w-0 overflow-hidden relative"
                      : "flex flex-col min-h-full w-full min-w-0"
                  )}>
                    {/* Barra superior PC: nav Portafolio/Mercados/Noticias/Mundo + buscador */}
                    {!isMobile && isFinanceTopBarPath(pathname) && <FinanceTopBar />}
                    {children}
                  </div>
                </SidebarInset>
              </SidebarProvider>
            ) : (
              <div className="flex flex-col min-h-full w-full">
                <div className="flex-1">
                  {children}
                </div>
                {mounted && !isFullscreenPage && !isAdminPage && !isLandingPage && !isSharePage && <Footer />}
              </div>
            )}
          </main>
          <ServiceWorkerRegistration />
          <CapacitorInit />
          {!isAdminPage && <PersonalizationApplier />}
          <AuthToast />
          {!isAdminPage && <ActiveArticleDrawer />}
          {!isAdminPage && <ReadingListWidget />}
          <PremiumConversionModal />
          <AuthModals
            isOpen={authModalOpen}
            onClose={closeModal}
            defaultView={authModalView}
          />
          <Toaster richColors position="top-right" closeButton />
        </div>

        {/* Dialog global de ajustes - fuera del flujo del layout para que el portal
            a document.body nunca quede atrapado por overflow-hidden ni z-index del sidebar. */}
        <ViewSettingsDialog
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          defaultTab={settingsTab as any}
        />
        <ReferralsDialog />
        <OnboardingDialog />
      </TooltipProvider>
    </ThemeProvider>
  );
}
