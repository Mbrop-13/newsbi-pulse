"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAssistantStore } from "@/lib/stores/assistant-store";
import { AuthModals } from "@/components/auth-modals";
import { AssistantLanding } from "@/components/assistant/assistant-landing";
import { AssistantSetup } from "@/components/assistant/assistant-setup";
import { AssistantDashboard } from "@/components/assistant/assistant-dashboard";

export default function AsistentePage() {
  const { isAuthenticated } = useAuthStore();
  const { hasCompletedSetup } = useAssistantStore();

  const [authModal, setAuthModal] = useState<{ isOpen: boolean; view: "login" | "register" }>({
    isOpen: false,
    view: "login"
  });

  const handleAuthRequest = (view: "login" | "register") => {
    setAuthModal({ isOpen: true, view });
  };

  return (
    <>
      <AuthModals 
        isOpen={authModal.isOpen} 
        onClose={() => setAuthModal({ ...authModal, isOpen: false })} 
        defaultView={authModal.view} 
      />

      {!isAuthenticated && (
        <AssistantLanding onAuthReq={handleAuthRequest} />
      )}

      {isAuthenticated && !hasCompletedSetup && (
         <AssistantSetup />
      )}

      {isAuthenticated && hasCompletedSetup && (
         <AssistantDashboard />
      )}
    </>
  );
}
