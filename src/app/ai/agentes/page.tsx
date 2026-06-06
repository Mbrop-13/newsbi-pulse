"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { AuthModals } from "@/components/auth-modals";
import { AssistantLanding } from "@/components/assistant/assistant-landing";
import { FullScreenChat } from "@/components/assistant/full-screen-chat";

export default function AIAgentesPage() {
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="w-8 h-8 rounded-full border-4 border-[#1890FF]/30 border-t-[#1890FF] animate-spin" />
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
        <FullScreenChat initialMode="mirofish" />
      )}
    </>
  );
}
