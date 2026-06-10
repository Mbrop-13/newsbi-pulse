"use client";

import Link from "next/link";

interface LogoProps {
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Logo({ showText = true, size = "md", className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-14",
    xl: "h-20",
  };

  return (
    <Link href="/" className={`flex items-center gap-3 group ${className}`} aria-label="Maverlang Home">
      <img 
        src="/assets/maverlang-logo-small.png" 
        alt="Maverlang" 
        className={`${sizeClasses[size]} w-auto object-contain transition-transform group-hover:scale-105`}
      />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-xl font-black tracking-tighter text-[#1890FF] italic">
            MAVERLANG
          </span>
        </div>
      )}
    </Link>
  );
}
