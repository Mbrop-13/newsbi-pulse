"use client";

import { Home, Radio, Cpu, TrendingUp, Globe, Briefcase } from "lucide-react";
import { CATEGORIES } from "@/lib/types";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
  Home: Home,
  Radio: Radio,
  Cpu: Cpu,
  Globe: Globe,
  TrendingUp: TrendingUp,
  Briefcase: Briefcase,
};

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto hide-scrollbar">
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.slug || (cat.id === "all" && activeCategory === "inicio");

        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.slug)}
            className={cn(
              "relative px-4 py-2 text-[13px] font-medium whitespace-nowrap transition-all duration-200",
              isActive
                ? "text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {cat.name}
            {cat.id === "live" && (
              <span className={cn(
                "ml-1.5 inline-block w-1.5 h-1.5 rounded-full",
                isActive ? "bg-live-red" : "bg-live-red/50",
                "animate-pulse-live"
              )} />
            )}
            {/* Underline indicator */}
            {isActive && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-foreground" />
            )}
          </button>
        );
      })}
    </div>
  );
}
