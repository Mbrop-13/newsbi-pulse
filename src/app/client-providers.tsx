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
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { AuthToast } from "@/components/auth-toast";
import { ReadingListWidget } from "@/components/reading-list-widget";
import { ResolvedBetsPopup } from "@/components/resolved-bet-popup";
import { PromoPopup } from "@/components/promo-popup";
import { RegisterCornerPopup } from "@/components/register-corner-popup";
import { CapacitorInit } from "@/components/capacitor-init";

import { useState, useEffect } from "react";
export function ClientLayoutProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const pathname = usePathname();
  const isFullscreenPage = pathname === "/mundo" || pathname === "/asistente";
  const isAssistantPage = pathname === "/asistente";
  const isAdminPage = pathname.startsWith("/admin");
  const audioMode = useAudioPlayerStore((s) => s.mode);
  const pinnedWidth = useAudioPlayerStore((s) => s.pinnedWidth);
  const aiChatOpen = useAIChatStore((s) => s.isOpen);

  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen">
          {!isAdminPage && !isAssistantPage && <Navbar />}
          <main
            className={`flex-1 transition-all duration-300 ease-in-out ${
              isFullscreenPage ? "overflow-hidden" : isAdminPage ? "" : "pb-16 md:pb-0"
            }`}
            style={{
              ...((!isAdminPage && audioMode === "pinned") ? { marginRight: pinnedWidth } : {}),
              ...((!isAdminPage && aiChatOpen && !isMobile) ? { marginRight: 400 } : {}),
              transition: 'margin-right 0.3s ease-in-out',
            }}
          >
            {children}
          </main>
          {!isFullscreenPage && !isAdminPage && <Footer />}
          {!isFullscreenPage && !isAdminPage && <MobileBottomNav />}
          <ServiceWorkerRegistration />
          <CapacitorInit />
          {!isAdminPage && <PersonalizationApplier />}
          {!isAdminPage && <AudioPlayerSidebar />}
          {!isAdminPage && <AIChatSidebar />}
          <AuthToast />
          {!isAdminPage && <ReadingListWidget />}
          {!isAdminPage && <ResolvedBetsPopup />}
          {!isAdminPage && <PromoPopup />}
          {!isAdminPage && <RegisterCornerPopup />}
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}
