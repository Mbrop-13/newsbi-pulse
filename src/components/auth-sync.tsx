"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSubscriptionStore } from "@/lib/stores/subscription-store";

/**
 * AuthSync is a global component that should be mounted ONCE in the root layout.
 * It listens to Supabase auth state changes and keeps the Zustand auth store
 * in sync with the actual session, including the user's tier and role.
 * 
 * This fixes the issue where navigating to pages that don't render the Navbar
 * (like /ai) would leave the auth store empty or stale.
 */
export function AuthSync() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoaded = useAuthStore((s) => s.setLoaded);
  const supabase = createClient();
  const isFetching = useRef(false);

  useEffect(() => {
    // 1. Immediately check for existing session on mount
    const initSession = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Preserve existing tier/role from persisted state during optimistic update
          const existingUser = useAuthStore.getState().user;
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.full_name || "Usuario",
            avatar: session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.user_metadata?.full_name || "U")}&background=1890FF&color=fff`,
            tier: existingUser?.tier,
            role: existingUser?.role,
          });

          // Fetch real tier and role
          try {
            const res = await fetch("/api/user/tier");
            if (res.ok) {
              const data = await res.json();
              setUser({
                id: session.user.id,
                email: session.user.email || "",
                name: session.user.user_metadata?.full_name || "Usuario",
                avatar: session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.user_metadata?.full_name || "U")}&background=1890FF&color=fff`,
                tier: data.tier,
                role: data.role,
              });
              useSubscriptionStore.getState().setTier(data.tier);
            }
          } catch (error) {
            console.error("[AuthSync] Failed to fetch user tier:", error);
          }
        }
      } catch (error) {
        console.error("[AuthSync] Failed to get session:", error);
      } finally {
        isFetching.current = false;
        setLoaded(true);
      }
    };

    initSession();

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Preserve existing tier/role during optimistic update
        const existingUser = useAuthStore.getState().user;
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.full_name || "Usuario",
          avatar: session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.user_metadata?.full_name || "U")}&background=1890FF&color=fff`,
          tier: existingUser?.tier,
          role: existingUser?.role,
        });

        // Fetch tier and role on every auth event
        try {
          const res = await fetch("/api/user/tier");
          if (res.ok) {
            const data = await res.json();
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.full_name || "Usuario",
              avatar: session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.user_metadata?.full_name || "U")}&background=1890FF&color=fff`,
              tier: data.tier,
              role: data.role,
            });
            useSubscriptionStore.getState().setTier(data.tier);
          }
        } catch (error) {
          console.error("[AuthSync] Failed to fetch tier on auth change:", error);
        }
      } else {
        setUser(null);
        useSubscriptionStore.getState().setTier("free");
      }
    });

    return () => { subscription.unsubscribe(); };
  }, [supabase, setUser]);

  return null; // This component renders nothing
}
