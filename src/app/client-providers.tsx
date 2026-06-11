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

import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { Button } from "@/components/ui/button";
import { Menu, Plus } from "lucide-react";
import { ModelSelector } from "@/components/chat/model-selector";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { useState, useEffect } from "react";

function MobileMenuButton() {
  const { setOpenMobile } = useSidebar();
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="fixed top-4 left-4 h-10 w-10 rounded-full shadow-lg border border-border/45 backdrop-blur-md bg-background/80 text-muted-foreground hover:text-foreground z-40 md:hidden flex items-center justify-center cursor-pointer active:scale-95 transition-all"
      onClick={() => setOpenMobile(true)}
      aria-label="Abrir menú"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}

export function ClientLayoutProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen: authModalOpen, view: authModalView, closeModal } = useAuthModalStore();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
  const isSidebarPage = isSidebarRoute && mounted && (!authLoaded || isAuthenticated);
  const isFullscreenPage = isSidebarPage;
  const isAiPage = pathname === "/ai" || pathname.startsWith("/ai/");
  const isAdminPage = pathname.startsWith("/admin");
  const audioMode = useAudioPlayerStore((s) => s.mode);
  const pinnedWidth = useAudioPlayerStore((s) => s.pinnedWidth);

  const messages = useAIChatStore((s) => s.messages);
  const hasMessages = messages.length > 0;
  
  // Show bottom nav on mobile for sidebar pages, EXCEPT when in a chat on AI page
  const showMobileNavOnSidebar = isMobile && isSidebarPage && (!isAiPage || !hasMessages);

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
                  {isMobile && <MobileMenuButton />}
                  <div className={cn(
                    "flex flex-col h-full min-h-screen w-full min-w-0 overflow-y-auto overflow-x-hidden",
                    showMobileNavOnSidebar && "pb-24"
                  )}>
                    {children}
                  </div>
                </SidebarInset>
              </SidebarProvider>
            ) : (
              children
            )}
          </main>
          {(!isFullscreenPage || showMobileNavOnSidebar) && !isAdminPage && !isLandingPage && <Footer />}
          {(!isFullscreenPage || showMobileNavOnSidebar) && !isAdminPage && !isLandingPage && <MobileBottomNav />}
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
