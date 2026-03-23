"use client";

import { useEffect, useState } from "react";
import { Gem } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDiamondStore } from "@/lib/stores/diamond-store";
import { useAuthStore } from "@/lib/stores/auth-store";

export function DiamondsButton() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { balance, loadDiamonds, canClaimToday } = useDiamondStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDiamonds(user.id);
    }
  }, [isAuthenticated, user, loadDiamonds]);

  const handleClick = () => {
    router.push("/recompensas");
  };

  // Wait until mounted if relying on auth to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button 
      onClick={handleClick}
      className="relative group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#1890FF]/10 dark:to-indigo-500/10 border border-blue-100 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-[#1890FF]/50 transition-all shadow-sm"
    >
      {canClaimToday && isAuthenticated && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-slate-950" />
      )}
      <Gem className="w-4 h-4 text-[#1890FF] fill-[#1890FF]/20 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{balance}</span>
    </button>
  );
}
