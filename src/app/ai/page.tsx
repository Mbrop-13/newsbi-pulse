"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { AuthModals } from "@/components/auth-modals";
import { AssistantLanding } from "@/components/assistant/assistant-landing";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ChatLanding } from "@/components/chat/chat-landing";

export default function AIPage() {
  const { isAuthenticated, isLoaded } = useAuthStore();

  const [authModal, setAuthModal] = useState<{ isOpen: boolean; view: "login" | "register" }>({
    isOpen: false,
    view: "login"
  });

  const handleAuthRequest = (view: "login" | "register") => {
    setAuthModal({ isOpen: true, view });
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AuthModals 
        isOpen={authModal.isOpen} 
        onClose={() => setAuthModal({ ...authModal, isOpen: false })} 
        defaultView={authModal.view} 
      />

      {!isAuthenticated ? (
        <AssistantLanding onAuthReq={handleAuthRequest} />
      ) : (
        <SidebarProvider>
          <AppSidebar />
          <ChatLanding />
        </SidebarProvider>
      )}
    </>
  );
}
