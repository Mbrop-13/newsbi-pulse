"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Home,
  Flame,
  Cpu,
  Globe,
  TrendingUp,
  Search,
} from "lucide-react";

const tabs = [
  { id: "home", href: "/", icon: Home, label: "Inicio" },
  { id: "trending", href: "/?category=live", icon: Flame, label: "Live" },
  { id: "search", href: "/?search=true", icon: Search, label: "Buscar" },
  { id: "tech", href: "/?category=tech", icon: Cpu, label: "Tech" },
  { id: "more", href: "/?category=business", icon: TrendingUp, label: "Más" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="glass border-t border-border">
        <div className="flex items-center justify-around px-2 h-14">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.id === "home" && pathname === "/");
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className="relative flex flex-col items-center justify-center w-full h-full"
              >
                <div className={`flex flex-col items-center gap-0.5 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
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
