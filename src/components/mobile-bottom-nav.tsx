"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import {
  Home,
  Flame,
  Cpu,
  Globe,
  TrendingUp,
  Search,
  LineChart,
  BarChart3,
  Sparkles
} from "lucide-react";

const tabs = [
  { id: "home", href: "/", icon: Home, label: "Inicio" },
  { id: "mercados", href: "/mercados", icon: LineChart, label: "Mercados" },
  { id: "ai", href: "#", icon: Sparkles, label: "R-ai" },
  { id: "predicciones", href: "/predicciones", icon: BarChart3, label: "Pronósticos" },
  { id: "search", href: "#", icon: Search, label: "Buscar" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="glass border-t border-border">
        <div className="flex items-center justify-around px-2 h-14">
          {tabs.map((tab) => {
            const isActive = tab.id !== "ai" && tab.id !== "search" && (pathname === tab.href || (tab.id === "home" && pathname === "/"));
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={(e) => {
                  if (tab.id === "search") {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent("open-search"));
                  } else if (tab.id === "ai") {
                    e.preventDefault();
                    useAIChatStore.getState().toggle();
                  }
                }}
                className="relative flex flex-col items-center justify-center w-full h-full"
              >
                <div className={`flex flex-col items-center gap-0.5 transition-colors ${
                  tab.id === "ai" 
                    ? "text-purple-500 hover:text-purple-400" 
                    : isActive ? "text-[#1890FF]" : "text-muted-foreground"
                }`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.5} />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="bottomNav"
                    className="absolute -top-px left-3 right-3 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
      {/* Safe area spacer for iOS */}
      <div className="h-[env(safe-area-inset-bottom)] glass" />
    </nav>
  );
}
