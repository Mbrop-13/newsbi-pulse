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
import { useAudioPlayerStore } from "@/lib/stores/audio-player-store";
import { AuthToast } from "@/components/auth-toast";

export function ClientLayoutProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFullscreenPage = pathname === "/mundo" || pathname === "/asistente";
  const isAssistantPage = pathname === "/asistente";
  const audioMode = useAudioPlayerStore((s) => s.mode);
  const pinnedWidth = useAudioPlayerStore((s) => s.pinnedWidth);

  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen">
          {isAssistantPage ? <AssistantNavbar /> : <Navbar />}
          <main
            className={`flex-1 transition-all duration-300 ease-in-out ${
              isFullscreenPage ? "overflow-hidden" : "pb-16 md:pb-0"
            }`}
            style={audioMode === "pinned" ? { marginRight: pinnedWidth } : undefined}
          >
            {children}
          </main>
          {!isFullscreenPage && <Footer />}
          {!isFullscreenPage && <MobileBottomNav />}
          <ServiceWorkerRegistration />
          <PersonalizationApplier />
          <AudioPlayerSidebar />
          <AuthToast />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}
