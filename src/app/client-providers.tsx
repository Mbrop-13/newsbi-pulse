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
  const isFullscreenPage = pathname === "/mundo" || pathname === "/ai" || pathname === "/ai/agentes";
  const isAssistantPage = pathname === "/ai" || pathname === "/ai/agentes";
  const isAdminPage = pathname.startsWith("/admin");
  const audioMode = useAudioPlayerStore((s) => s.mode);
  const pinnedWidth = useAudioPlayerStore((s) => s.pinnedWidth);

  return (
    <ThemeProvider>
      <TooltipProvider>
        <AuthSync />
        <div className="flex flex-col min-h-screen">
          {!isAdminPage && !isLandingPage && !pathname.startsWith("/ai") && pathname !== "/mundo" && (
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
            {children}
          </main>
          {!isFullscreenPage && !isAdminPage && !isLandingPage && <Footer />}
          {!isFullscreenPage && !isAdminPage && !isLandingPage && <MobileBottomNav />}
          <ServiceWorkerRegistration />
          <CapacitorInit />
          {!isAdminPage && <PersonalizationApplier />}
          {!isAdminPage && <AudioPlayerSidebar />}
          {!isAdminPage && <AIChatSidebar />}
          <AuthToast />
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
