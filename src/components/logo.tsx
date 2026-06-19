"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import Link from "next/link";

interface LogoProps {
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: 1 | 2;
  forceLight?: boolean;
}

export function Logo({ showText = true, size = "md", className = "", variant = 1, forceLight = false }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizeClasses = {
    sm: "h-5 md:h-6",
    md: "h-6 md:h-8",
    lg: "h-8 md:h-12",
    xl: "h-10 md:h-16",
  };

  const isDark = forceLight ? false : (mounted && resolvedTheme === "dark");
  const logoSrc = variant === 1 
    ? (isDark ? "/assets/Logo 1-Blanco.png" : "/assets/Maverlang Logo-1.png")
    : (isDark ? "/assets/Logo 2-Blanco.png" : "/assets/Maverlang Logo-2.png");

  return (
    <Link href="/" className={`flex items-center gap-3 group ${className}`} aria-label="Maverlang Home">
      <img 
        src={logoSrc} 
        alt="Maverlang" 
        className={`${sizeClasses[size]} w-auto object-contain transition-transform group-hover:scale-105`}
      />
      {showText && variant === 2 && (
        <div className="flex flex-col leading-none">
          <span className="text-xl font-black tracking-tighter text-black dark:text-white italic">
            MAVERLANG
          </span>
        </div>
      )}
    </Link>
  );
}
