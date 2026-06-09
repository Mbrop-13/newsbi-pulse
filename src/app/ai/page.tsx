"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { AuthModals } from "@/components/auth-modals";
import { AssistantLanding } from "@/components/assistant/assistant-landing";
import { ChatLanding } from "@/components/chat/chat-landing";

function ChatSkeleton() {
  const skeletonWidths = ["75%", "65%", "85%", "70%"];
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Skeleton (desktop only) */}
      <div className="hidden md:flex w-64 border-r border-border flex-col p-4 space-y-6 shrink-0 bg-card">
        <div className="h-8 w-32 bg-muted/60 rounded-lg animate-pulse" />
        <div className="space-y-3 flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 bg-muted/40 rounded-lg animate-pulse" style={{ width: skeletonWidths[i % skeletonWidths.length] }} />
          ))}
        </div>
        <div className="h-10 bg-muted/40 rounded-lg animate-pulse" />
      </div>
      
      {/* Main Chat Area Skeleton */}
      <div className="flex-1 flex flex-col h-screen">
        <div className="flex-1 max-w-3xl mx-auto w-full pt-20 px-4 space-y-6 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'justify-end'}`}>
              {i % 2 === 0 && <div className="h-8 w-8 rounded-full bg-muted/50 animate-pulse shrink-0" />}
              <div className="space-y-2 max-w-[70%]">
                <div className="h-4 bg-muted/40 rounded animate-pulse" style={{ width: i % 2 === 0 ? '120px' : '80px' }} />
                <div className="h-16 bg-muted/30 rounded-2xl animate-pulse" style={{ width: i % 2 === 0 ? '400px' : '300px' }} />
              </div>
            </div>
          ))}
        </div>
        
        {/* Bottom Input Skeleton */}
        <div className="max-w-3xl mx-auto w-full px-4 pb-6 pt-4 shrink-0">
          <div className="h-12 w-full bg-muted/30 border border-border/50 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

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
    return <ChatSkeleton />;
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
        <ChatLanding />
      )}
    </>
  );
}
