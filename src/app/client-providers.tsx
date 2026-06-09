"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { AssistantNavbar } from "@/components/assistant-navbar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegistration } from "@/components/sw-register";
import { PersonalizationApplier } from "@/components/personalization-applier";
import { AudioPlayerSidebar } from "@/components/audio-player-sidebar";
import { AIChatSidebar } from "@/components/ai-chat-sidebar";
import { useAudioPlayerStore } from "@/lib/stores/audio-player-store";
import { AuthToast } from "@/components/auth-toast";
import { ReadingListWidget } from "@/components/reading-list-widget";
import { ResolvedBetsPopup } from "@/components/resolved-bet-popup";
import { CapacitorInit } from "@/components/capacitor-init";
import { AuthSync } from "@/components/auth-sync";
import { PremiumConversionModal } from "@/components/premium-conversion-modal";
import { AuthModals } from "@/components/auth-modals";
import { useAuthModalStore } from "@/lib/stores/auth-store";
import { Toaster } from "sonner";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ActiveArticleDrawer } from "@/components/active-article-drawer";

import { useState, useEffect } from "react";
export function ClientLayoutProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen: authModalOpen, view: authModalView, closeModal } = useAuthModalStore();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  // Pages that use the sidebar layout (no navbar/footer)
  const sidebarPages = [
    "/ai",
    "/ai/agentes",
    "/noticias",
    "/mercados",
    "/portafolio",
    "/mundo",
    "/configuracion",
    "/economia",
    "/finanzas",
    "/inversiones",
    "/tech-global",
    "/impacto-global"
  ];
  const isStaticSidebar = sidebarPages.some(p => pathname === p || pathname.startsWith(p + "/"));
  const isArticlePage = pathname.startsWith("/article/");
  const countrySlugs = ["chile", "argentina", "colombia", "brasil", "ecuador", "mexico"];
  const isCountryPage = countrySlugs.some(slug => pathname === `/${slug}` || pathname.startsWith(`/${slug}/`));
  const isSidebarRoute = isStaticSidebar || isArticlePage || isCountryPage;
  const { isAuthenticated, isLoaded: authLoaded } = useAuthStore();
  const isSidebarPage = isSidebarRoute && (!authLoaded || isAuthenticated);
  const isFullscreenPage = isSidebarPage;
  const isAssistantPage = pathname === "/ai" || pathname === "/ai/agentes";
  const isAdminPage = pathname.startsWith("/admin");
  const audioMode = useAudioPlayerStore((s) => s.mode);
  const pinnedWidth = useAudioPlayerStore((s) => s.pinnedWidth);

  return (
    <ThemeProvider>
      <TooltipProvider>
        <AuthSync />
        <div className="flex flex-col min-h-screen">
          {!isAdminPage && !isLandingPage && !isSidebarPage && (
            <Navbar />
          )}
          <main
            className={`flex-1 transition-all duration-300 ease-in-out ${
              isFullscreenPage ? "overflow-hidden" : isAdminPage ? "" : "pb-16 md:pb-0"
            }`}
            style={{
              ...((!isAdminPage && audioMode === "pinned") ? { marginRight: pinnedWidth } : {}),
              transition: 'margin-right 0.3s ease-in-out',
            }}
          >
            {isSidebarPage ? (
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  <div className="flex flex-col h-full min-h-screen w-full min-w-0 overflow-y-auto overflow-x-hidden">
                    {children}
                  </div>
                </SidebarInset>
              </SidebarProvider>
            ) : (
              children
            )}
          </main>
          {!isFullscreenPage && !isAdminPage && !isLandingPage && <Footer />}
          {!isFullscreenPage && !isAdminPage && !isLandingPage && <MobileBottomNav />}
          <ServiceWorkerRegistration />
          <CapacitorInit />
          {!isAdminPage && <PersonalizationApplier />}
          {!isAdminPage && <AudioPlayerSidebar />}
          {!isAdminPage && <AIChatSidebar />}
          <AuthToast />
          {!isAdminPage && <ActiveArticleDrawer />}
          {!isAdminPage && <ReadingListWidget />}
          {!isAdminPage && <ResolvedBetsPopup />}
          <PremiumConversionModal />
          <AuthModals 
            isOpen={authModalOpen}
            onClose={closeModal}
            defaultView={authModalView}
          />
          <Toaster richColors position="top-right" />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}
